'use strict';

const fs = require('fs');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

jest.setTimeout(20000);

afterEach(() => createCompiler.teardown());

it('should fulfill with the compilation result', async () => {
    const compiler = createCompiler(configBasic);

    const { stats, duration } = await compiler.run();

    expect(stats.toJson().assetsByChunkName).toEqual({ main: 'app.js' });
    expect(typeof duration).toBe('number');
});

it('should fail if the compilation fails', async () => {
    const compiler = createCompiler(configSyntaxError);

    expect.assertions(2);

    try {
        await compiler.run();
    } catch (err) {
        expect(err instanceof Error).toBe(true);
        expect(err.message).toBe('Webpack compilation failed');
    }
});

it('should fail if there\'s a fatal error', async () => {
    const compiler = createCompiler(configBasic);
    const contrivedError = new Error('foo');

    compiler.addHook('beforeRun', 'tapAsync', (compiler, callback) => callback(contrivedError));

    try {
        await compiler.run();
    } catch (err) {
        expect(err).toBe(contrivedError);
    }
});

it('should output assets', async () => {
    const compiler = createCompiler(configBasic);

    await compiler.run();

    expect(fs.existsSync(`${compiler.webpackConfig.output.path}/app.js`)).toBe(true);
});

it('should throw if not idle', () => {
    const compiler = createCompiler(configBasic);
    const promise = compiler.run().catch(() => {});

    expect(() => compiler.run()).toThrow(/\bidle\b/);
    expect(() => compiler.watch()).toThrow(/\bidle\b/);

    return promise;
});
