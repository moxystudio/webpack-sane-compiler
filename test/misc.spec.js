'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const webpack = require('webpack');
const saneCompiler = require('../');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');

jest.setTimeout(20000);

afterEach(() => createCompiler.teardown());

it('should give access to webpack compiler & config', () => {
    const compiler = createCompiler(configBasic);

    expect(typeof compiler.webpackConfig).toBe('object');
    expect(typeof compiler.webpackConfig.output).toBe('object');
    expect(typeof compiler.webpackCompiler).toBe('object');
    expect(typeof compiler.webpackCompiler.createCompilation).toBe('function');
});

it('should prevent direct access to webpack compiler\'s main methods', () => {
    const compiler = createCompiler(configBasic);

    expect(() => compiler.webpackCompiler.run).toThrow(/\bpublic API\b/);
    expect(() => compiler.webpackCompiler.watch).toThrow(/\bpublic API\b/);
});

it('should override the webpack compiler\'s outputFileSystem to a fully featured node fs', () => {
    const compiler = createCompiler(configBasic);

    expect(compiler.webpackCompiler.outputFileSystem).toMatchObject({ ...fs, mkdirp });
});

it('should allow passing a compiler instead of a webpack config', async () => {
    const webpackCompiler = webpack(createCompiler.uniquifyConfig(configBasic));
    const compiler = saneCompiler(webpackCompiler);

    const { stats } = await compiler.run();

    expect(stats.toJson().assetsByChunkName).toEqual({ main: 'app.js' });
});
