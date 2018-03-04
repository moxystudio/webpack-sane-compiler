'use strict';

const assert = require('assert');
const webpack = require('webpack');
const pDefer = require('p-defer');
const wrap = require('lodash.wrap');
const observeWebpackCompiler = require('./lib/observeWebpackCompiler');
const nodeFs = require('./lib/nodeFs');

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

    const { eventEmitter, state, addHook } = observeWebpackCompiler(webpackCompiler);

    webpackCompiler.outputFileSystem = nodeFs();

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

        assertIdle(calledMethod) {
            const getAssertMessage = (reason) =>
                reason + (calledMethod ? `, you can only call '${calledMethod}' when the compiler is idle` : '');

            assert(!state.webpackWatching, getAssertMessage('Compiler is watching'));
            assert(!state.isCompiling, getAssertMessage('Compiler is running'));
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

            handler = handler && wrap(handler, (handler) => {
                !state.isCompiling && handler(state.error, state.compilation);
            });

            const webpackWatching = webpackCompiler.watch(options, handler);

            return () => {
                // Ignore if the watching instance is no longer the same
                if (webpackWatching !== state.webpackWatching) {
                    return;
                }

                eventEmitter.emit('invalidate');
                state.webpackWatching.invalidate();
            };
        },

        unwatch() {
            if (!state.webpackWatching) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                // As per the documentation, .close() never fails
                // Additionally, we rely on `watch-close` event because only the latest callback
                // gets called if webpackWatching.close(callback) is called multiple times
                addHook('watchClose', resolve);
                state.webpackWatching.close();
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

            const cleanup = () => {
                eventEmitter
                .removeListener('error', onError)
                .removeListener('end', onEnd);
            };

            const onError = (err) => {
                cleanup();

                deferred.reject(err);
            };

            const onEnd = (compilation) => {
                cleanup();

                deferred.resolve(compilation);
            };

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
