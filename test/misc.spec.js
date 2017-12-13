'use strict';

const webpack = require('webpack');
const saneCompiler = require('../');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');

describe('misc', () => {
    afterEach(() => createCompiler.teardown());

    it('should give access to webpack compiler & config', () => {
        const compiler = createCompiler(configBasic);

        expect(typeof compiler.webpackConfig).toBe('object');
        expect(typeof compiler.webpackConfig.output).toBe('object');
        expect(typeof compiler.webpackCompiler).toBe('object');
        expect(typeof compiler.webpackCompiler.plugin).toBe('function');
    });

    it('should prevent direct access to webpack compiler\'s main methods', () => {
        const compiler = createCompiler(configBasic);

        expect(() => compiler.webpackCompiler.run).toThrow(/\bpublic API\b/);
        expect(() => compiler.webpackCompiler.watch).toThrow(/\bpublic API\b/);
    });

    it('should allow passing a compiler instead of a webpack config', () => {
        const webpackCompiler = webpack(createCompiler.uniquifyConfig(configBasic));
        const compiler = saneCompiler(webpackCompiler);

        return compiler
        .run()
        .then((stats) => {
            expect(stats.toJson().assetsByChunkName).toEqual({ main: 'client.js' });
        });
    });
});
