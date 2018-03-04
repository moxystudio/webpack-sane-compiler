'use strict';

const EventEmitter = require('events');
const wrap = require('lodash.wrap');
const kebabCase = require('lodash.kebabcase');

function createAddHook(webpackCompiler) {
    // Webpack >=4 has a new hooks API
    // Still, we must fallback to the old plugins API for Webpack <= 3
    return (name, method, callback) => {
        if (typeof method === 'function') {
            callback = method;
            method = 'tap';
        }

        /* istanbul ignore else */
        if (webpackCompiler.hooks) {
            webpackCompiler.hooks[name][method]('webpack-sane-compiler', (...args) => callback(...args));
        } else {
            webpackCompiler.plugin(kebabCase(name), (...args) => callback(...args));
        }
    };
}

function observeWebpackCompiler(webpackCompiler) {
    const eventEmitter = new EventEmitter();
    const state = {
        isCompiling: false,
        error: null,
        compilation: null,
        webpackWatching: null,
    };
    const addHook = createAddHook(webpackCompiler);

    // Avoid NodeJS global throw if there's no error listeners
    eventEmitter.on('error', () => {});

    // Listen to when a standard run() starts and fails
    webpackCompiler.run = wrap(webpackCompiler.run, (run, callback) => {
        // Compilation is starting
        Object.assign(state, { isCompiling: true, error: null, compilation: null });
        eventEmitter.emit('begin');

        run.call(webpackCompiler, (error, stats) => {
            // Compilation finished, the 'failed' plugin is not emitted in this case
            // See: https://github.com/webpack/docs/wiki/plugins/ad6ef7e44bec0c2f1a545a5d983a0938966ccaee#failederr-error
            if (error) {
                // If error is not set, then state.error will have been updated in the 'done' callback below.
                Object.assign(state, { isCompiling: false, error, compilation: null });
                eventEmitter.emit('error', error);
            }

            callback(error, stats);
        });
    });

    // Listen to when the compilation finishes
    // This is called for both .run() and .watch()
    addHook('done', (stats) => {
        // Does it have compilation errors?
        if (stats.hasErrors()) {
            const error = Object.assign(new Error('Webpack compilation failed'), { stats });

            Object.assign(state, { isCompiling: false, error, compilation: null });
            eventEmitter.emit('error', error);
        // Otherwise the build finished successfully
        } else {
            Object.assign(state, { isCompiling: false, error: null, compilation: { stats, duration: stats.endTime - stats.startTime } });
            eventEmitter.emit('end', state.compilation);
        }
    });

    // Listen to when watch mode triggers a run
    addHook('watchRun', 'tapAsync', (compiler, callback) => {
        Object.assign(state, { isCompiling: true, error: null, compilation: null });
        eventEmitter.emit('begin');
        callback();
    });

    // Listen to when the compilation fails when in watch mode
    addHook('failed', (error) => {
        Object.assign(state, { isCompiling: false, error, compilation: null });
        eventEmitter.emit('error', error);
    });

    // Listen to when watch mode starts
    webpackCompiler.watch = wrap(webpackCompiler.watch, (watch, options, handler) => {
        state.webpackWatching = watch.call(webpackCompiler, options, handler);

        return state.webpackWatching;
    });

    // Listen to when watch mode is closed
    addHook('watchClose', () => {
        state.webpackWatching = null;

        if (state.isCompiling) {
            const error = Object.assign(new Error('Webpack compilation canceled'), { hideStack: true });

            Object.assign(state, { isCompiling: false, error, compilation: null });
            eventEmitter.emit('error', error);
        }
    });

    return {
        eventEmitter,
        state,
        addHook,
    };
}

module.exports = observeWebpackCompiler;
module.exports.createAddHook = createAddHook;
