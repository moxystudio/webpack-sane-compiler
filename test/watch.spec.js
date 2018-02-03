'use strict';

const fs = require('fs');
const createCompiler = require('./util/createCompiler');
const touchFile = require('./util/touchFile');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

afterEach(() => createCompiler.teardown());

it('should call the handler everytime a file changes', (done) => {
    const compiler = createCompiler(configBasic);
    let callsCount = 0;

    compiler.watch((err, { stats, duration }) => {
        expect(err).toBe(null);
        expect(stats.toJson().assetsByChunkName).toEqual({ main: 'app.js' });
        expect(typeof duration).toBe('number');

        callsCount += 1;

        if (callsCount === 2) {
            done();
        } else {
            touchFile(configBasic.entry);
        }
    });
});

it('should fail if the compiler fails', (done) => {
    const compiler = createCompiler(configSyntaxError);

    compiler.watch((err, compilation) => {
        expect(err instanceof Error).toBe(true);
        expect(compilation).toBe(null);

        done();
    });
});

it('should fail if there\'s a fatal error', (done) => {
    const compiler = createCompiler(configBasic);
    const contrivedError = new Error('foo');

    compiler.webpackCompiler.plugin('watch-run', (compiler, callback) => callback(contrivedError));

    compiler.watch((err) => {
        expect(err).toBe(contrivedError);

        done();
    });
});

it('should output assets', (done) => {
    const compiler = createCompiler(configBasic);

    compiler.watch(() => {
        expect(fs.existsSync(`${compiler.webpackConfig.output.path}/app.js`)).toBe(true);

        done();
    });
});

describe('invalidate', () => {
    it('should return a function that can be used to invalidate and retrigger a compilation', (done) => {
        const compiler = createCompiler(configBasic);
        const logEvent = jest.fn();

        compiler.once('begin', () => setImmediate(() => invalidate()));
        compiler.on('begin', () => logEvent('begin'));
        compiler.on('invalidate', () => logEvent('invalidate'));
        compiler.on('end', () => logEvent('end'));

        const invalidate = compiler.watch(() => {
            const loggedEvents = logEvent.mock.calls.reduce((results, [event]) => [...results, event], []);

            expect(loggedEvents).toEqual(['begin', 'invalidate', 'begin', 'end']);

            done();
        });
    });

    it('should be a noop if the watcher is no longer active', async () => {
        const compiler = createCompiler(configBasic);

        const invalidate = compiler.watch(() => {});

        await compiler
        .on('error', () => {})
        .unwatch();

        expect(() => invalidate()).not.toThrow();
    });
});

describe('args', () => {
    it('should work with .watch()', (done) => {
        const compiler = createCompiler(configBasic);

        compiler
        .on('end', () => done())
        .on('error', (err) => done.fail(err))
        .watch();
    });

    it('should work with .watch(options)', (done) => {
        const compiler = createCompiler(configBasic);

        compiler
        .on('end', () => done())
        .on('error', (err) => done.fail(err))
        .watch({ poll: true });
    });

    it('should work with .watch(options, handler)', (done) => {
        const compiler = createCompiler(configBasic);

        compiler.watch({}, (err) => {
            if (err) {
                done.fail(err);
            } else {
                done();
            }
        });
    });

    it('should work with .watch(handler)', (done) => {
        const compiler = createCompiler(configBasic);

        compiler.watch((err) => {
            if (err) {
                done.fail(err);
            } else {
                done();
            }
        });
    });

    it('should throw if not idle', () => {
        const compiler = createCompiler(configBasic);

        compiler.watch();

        expect(() => compiler.run()).toThrow(/\bidle\b/);
        expect(() => compiler.watch()).toThrow(/\bidle\b/);
    });
});
