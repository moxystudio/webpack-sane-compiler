'use strict';

const delay = require('delay');
const createCompiler = require('./util/createCompiler');
const touchFile = require('./util/touchFile');
const configBasic = require('./configs/basic');

afterEach(() => createCompiler.teardown());

it('should return a promise', () => {
    const compiler = createCompiler(configBasic);

    compiler.watch();

    const promise = compiler.unwatch();

    expect(promise).toBeDefined();
    expect(promise instanceof Promise).toBe(true);
});

it('should stop watching changes (sync)', async () => {
    const compiler = createCompiler(configBasic);

    let callsCount = 0;

    compiler.watch(() => { callsCount += 1; });

    const unwatchPromise = compiler.unwatch();

    await Promise.all([unwatchPromise, delay(2000)]);

    expect(callsCount).toBe(0);
});

it('should stop watching changes (async)', async () => {
    const compiler = createCompiler(configBasic);

    let callsCount = 0;

    // Watch changes & wait
    // When done, unwatch & modify files
    await new Promise((resolve) => {
        compiler.watch(() => {
            callsCount += 1;

            if (callsCount === 1) {
                resolve(compiler.unwatch().then(() => touchFile(configBasic.entry)));
            }
        });
    });

    // At this point, `callsCount` should remain 1
    await delay(2000);

    expect(callsCount).toBe(1);
});

it('should resolve all promises returned by unwatch if it gets called multiple times', () => {
    const compiler = createCompiler(configBasic);

    compiler.watch();

    const promises = [compiler.unwatch(), compiler.unwatch()];

    return Promise.all([promises]);
});

it('should not crash if not watching', () => {
    const compiler = createCompiler(configBasic);

    return compiler.unwatch();
});
