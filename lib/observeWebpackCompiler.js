'use strict';

const EventEmitter = require('events');
const wrap = require('lodash.wrap');

function observeWebpackCompiler(webpackCompiler) {
    const eventEmitter = new EventEmitter();
    const state = {
        isCompiling: false,
        error: null,
        compilation: null,
        webpackWatching: null,
    };

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
    function done(stats) {
        if (stats.hasErrors()) {
            const error = Object.assign(new Error('Webpack compilation failed'), { stats });

            Object.assign(state, { isCompiling: false, error, compilation: null });
            eventEmitter.emit('error', error);
            // Otherwise the build finished successfully
        } else {
            Object.assign(state, { isCompiling: false, error: null, compilation: { stats, duration: stats.endTime - stats.startTime } });
            eventEmitter.emit('end', state.compilation);
        }
    }
    // Listen to when watch mode triggers a run
    function pluginWatchRun(compiler, callback) {
        Object.assign(state, { isCompiling: true, error: null, compilation: null });
        eventEmitter.emit('begin');
        callback();
    }

    // Listen to when the compilation fails when in watch mode
    function pluginFailed(error) {
        Object.assign(state, { isCompiling: false, error, compilation: null });
        eventEmitter.emit('error', error);
    }

    // Listen to when watch mode starts
    webpackCompiler.watch = wrap(webpackCompiler.watch, (watch, options, handler) => {
        state.webpackWatching = watch.call(webpackCompiler, options, handler);

        return state.webpackWatching;
    });

    // Listen to when watch mode is closed
    function pluginWatchClose() {
        state.webpackWatching = null;

        if (state.isCompiling) {
            const error = Object.assign(new Error('Webpack compilation canceled'), { hideStack: true });

            Object.assign(state, { isCompiling: false, error, compilation: null });
            eventEmitter.emit('error', error);
        }
    }

    // Check version by finding if hook is avaiable
    if ('hooks' in webpackCompiler) {
        webpackCompiler.hooks.done.tap('done', (stats) => { done(stats); });
        webpackCompiler.hooks.watchRun.tapAsync('watchRun', (compiler, callback) => { pluginWatchRun(compiler, callback); });
        webpackCompiler.hooks.failed.tap('failed', (error) => { pluginFailed(error); });
        webpackCompiler.hooks.watchClose.tap('watchClose', () => { pluginWatchClose(); });
    } else {
        webpackCompiler.plugin('done', (stats) => { done(stats); });
        webpackCompiler.plugin('watch-run', (compiler, callback) => { pluginWatchRun(compiler, callback); });
        webpackCompiler.plugin('failed', (error) => { pluginFailed(error); });
        webpackCompiler.plugin('watch-close', () => { pluginWatchClose(); });
    }

    return { eventEmitter, state };
}

module.exports = observeWebpackCompiler;
