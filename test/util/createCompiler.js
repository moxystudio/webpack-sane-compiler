'use strict';

const path = require('path');
const pFinally = require('p-finally');
const saneCompiler = require('../../');

const tmpDir = path.resolve(`${__dirname}/../tmp`);
const compilers = [];

function createCompiler(webpackConfig) {
    const compiler = saneCompiler(uniquifyConfig(webpackConfig));

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
        );
    }));
}

function uniquifyConfig(webpackConfig) {
    if (webpackConfig.output.path.indexOf(tmpDir) !== 0) {
        throw new Error(`\`webpackConfig.output.path\` must start with ${tmpDir}`);
    }

    const uid = `${Math.round(Math.random() * 100000000000).toString(36)}-${Date.now().toString(36)}`;

    webpackConfig = ({ ...webpackConfig });
    webpackConfig.output = ({ ...webpackConfig.output });
    webpackConfig.output.path = webpackConfig.output.path.replace(tmpDir, path.join(tmpDir, uid));

    return webpackConfig;
}

module.exports = createCompiler;
module.exports.teardown = teardown;
module.exports.uniquifyConfig = uniquifyConfig;
