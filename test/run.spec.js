'use strict';

const fs = require('fs');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

describe('.run()', () => {
    afterEach(() => createCompiler.teardown());

    it('should fulfill with stats', () => {
        const compiler = createCompiler(configBasic);

        return compiler
        .run()
        .then((stats) => {
            expect(stats.toJson().assetsByChunkName).toEqual({ main: 'client.js' });
        });
    });

    it('should fail if the compilers fails', () => {
        const compiler = createCompiler(configSyntaxError);

        compiler
        .run()
        .catch((err) => {
            expect(err instanceof Error).toBe(true);
            expect(err.message).toMatch(/\bwebpack compilation failed\b/);
        });
    });

    it('should fail if there\'s a fatal error', () => {
        const compiler = createCompiler(configBasic);
        const contrivedError = new Error('foo');

        compiler.webpackCompiler.plugin('before-run', (compiler, callback) => {
            setImmediate(() => callback(contrivedError));
        });

        return compiler
        .run()
        .then(() => {
            throw new Error('Should have failed');
        }, (err) => {
            expect(err).toBe(contrivedError);
        });
    });

    it('should output assets', () => {
        const compiler = createCompiler(configBasic);

        return compiler
        .run()
        .then(() => {
            expect(fs.existsSync(`${compiler.webpackConfig.output.path}/client.js`)).toBe(true);
        });
    });

    it('should throw if not idle', () => {
        const compiler = createCompiler(configBasic);
        const promise = compiler.run().catch(() => {});

        expect(() => compiler.run()).toThrow(/\bidle\b/);
        expect(() => compiler.watch()).toThrow(/\bidle\b/);

        return promise;
    });
});
