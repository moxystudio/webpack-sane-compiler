'use strict';

const assert = require('assert');
const webpack = require('webpack');
const pDefer = require('p-defer');

const observeWebpackCompiler = require('./lib/observeWebpackCompiler');

function preventOriginalAPIDirectUsage(compiler) {
    const blacklistedMethods = ['run', 'watch'];

    compiler.webpackCompiler = new Proxy(compiler.webpackCompiler, {
        get(target, property) {
            if (blacklistedMethods.includes(property)) {
                throw new Error('Direct access to webpack compiler\'s public API is not allowed');
            }

            return target[property];
        },
    });
}

function compiler(webpackArg) {
    const webpackCompiler = webpackArg.run ? webpackArg : webpack(webpackArg);
    const webpackConfig = webpackArg.run ? webpackCompiler.options : webpackArg;

    const { eventEmitter, state } = observeWebpackCompiler(webpackCompiler);

    const compiler = Object.assign(eventEmitter, {
        webpackConfig,
        webpackCompiler,

        isCompiling() {
            return state.isCompiling;
        },

        getCompilation() {
            return state.compilation;
        },

        getError() {
            return state.error;
        },

        assertIdle(calledMethod = 'this') {
            assert(!state.webpackWatcher, `Compiler is watching, you can only call '${calledMethod}' when the compiler is idle`);
            assert(!state.isCompiling, `Compiler is compiling, you can only call '${calledMethod}' when the compiler is idle`);
        },

        run() {
            compiler.assertIdle('run');

            return new Promise((resolve, reject) => {
                webpackCompiler.run(() => {
                    if (state.error) {
                        reject(state.error);
                    } else {
                        resolve(state.compilation);
                    }
                });
            });
        },

        watch(options, handler = () => {}) {
            compiler.assertIdle('watch');

            if (typeof options === 'function') {
                handler = options;
                options = null;
            }

            function baseHandler() {
                !state.isCompiling && handler(state.error, state.compilation);
            }

            webpackCompiler.watch(options, baseHandler);

            return compiler;
        },

        unwatch() {
            if (!state.webpackWatcher) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                // As per the documentation, .close() never fails
                // Additionally, we rely on `watch-close` event because only the latest callback
                // gets called if webpackWatching.close(callback) is called multiple times
                webpackCompiler.plugin('watch-close', resolve);
                state.webpackWatcher.close();
            });
        },

        resolve() {
            const { error, compilation } = state;

            // Already resolved?
            if (error) {
                return Promise.reject(error);
            }

            if (compilation) {
                return Promise.resolve(compilation);
            }

            // Wait for it to be resolved
            const deferred = pDefer();

            function cleanup() {
                eventEmitter
                .removeListener('error', onError)
                .removeListener('end', onEnd);
            }

            function onError(err) {
                cleanup();

                deferred.reject(err);
            }

            function onEnd(compilation) {
                cleanup();

                deferred.resolve(compilation);
            }

            compiler
            .on('error', onError)
            .on('end', onEnd);

            return deferred.promise;
        },
    });

    preventOriginalAPIDirectUsage(compiler);

    return compiler;
}

module.exports = compiler;
