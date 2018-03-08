'use strict';

const path = require('path');
const webpack = require('webpack');
const pify = require('pify');
const pFinally = require('p-finally');
const rimraf = pify(require('rimraf'));
const saneCompiler = require('../../');
const { createAddHook } = require('../../lib/observeWebpackCompiler');

const supportsMode = !!webpack.version;
const tmpDir = path.resolve(`${__dirname}/../tmp`);
const compilers = [];

function createCompiler(webpackConfig) {
    const compiler = saneCompiler(prepareConfig(webpackConfig));

    compiler.addHook = createAddHook(compiler.webpackCompiler);
    compilers.push(compiler);

    return compiler;
}

function teardown() {
    return Promise.all(compilers.map((compiler) => {
        // Clear all listeners
        compiler.removeAllListeners().on('error', () => {});

        return pFinally(
            // Unwatch
            compiler.unwatch()

            // Wait for compilation.. just in case..
            .then(() => {
                if (!compiler.isCompiling()) {
                    return;
                }

                return new Promise((resolve) => {
                    compiler
                    .on('end', resolve)
                    .on('error', resolve);
                });
            }),

            // Remove output dir
            () => rimraf(compiler.webpackConfig.output.path)
        );
    }));
}

function prepareConfig(webpackConfig) {
    if (webpackConfig.output.path.indexOf(tmpDir) !== 0) {
        throw new Error(`\`webpackConfig.output.path\` must start with ${tmpDir}`);
    }

    // Uniquify config
    const uid = `${Math.round(Math.random() * 100000000000).toString(36)}-${Date.now().toString(36)}`;

    webpackConfig = { ...webpackConfig };
    webpackConfig.output = { ...webpackConfig.output };
    webpackConfig.output.path = webpackConfig.output.path.replace(tmpDir, path.join(tmpDir, uid));

    // Ensure mode is set to development on webpack >= 4
    if (supportsMode) {
        webpackConfig.mode = 'development';
    }

    return webpackConfig;
}

module.exports = createCompiler;
module.exports.teardown = teardown;
module.exports.prepareConfig = prepareConfig;
