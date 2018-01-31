'use strict';

const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

function createCompilerWithEvents(...args) {
    const compiler = createCompiler(...args);
    const events = [];

    compiler.on('begin', () => events.push('begin'));
    compiler.on('error', () => events.push('error'));
    compiler.on('end', () => events.push('end'));

    return { compiler, events };
}

afterEach(() => createCompiler.teardown());

it('should emit correct events on a successful .run()', async () => {
    const { compiler, events } = createCompilerWithEvents(configBasic);

    await compiler.run();

    expect(events).toEqual(['begin', 'end']);
});

it('should emit correct events on a failed .run()', async () => {
    const { compiler, events } = createCompilerWithEvents(configSyntaxError);

    try {
        await compiler.run();
    } catch (err) { /* Do nothing */ }

    expect(events).toEqual(['begin', 'error']);
});

it('should emit correct events on a successful .watch() cycle', (done) => {
    const { compiler, events } = createCompilerWithEvents(configBasic);

    function finish() {
        expect(events).toEqual(['begin', 'end']);

        done();
    }

    compiler
    .on('end', finish)
    .on('error', finish)
    .watch();
});

it('should emit correct events on a failed .watch() cycle', (done) => {
    const { compiler, events } = createCompilerWithEvents(configSyntaxError);

    function finish() {
        expect(events).toEqual(['begin', 'error']);

        done();
    }

    compiler
    .on('end', finish)
    .on('error', finish)
    .watch();
});

it('should emit the correct events if a compilation was canceled via .unwatch()', (done) => {
    const { compiler, events } = createCompilerWithEvents(configBasic);
    let error;

    function finish() {
        expect(events).toEqual(['begin', 'error']);
        expect(error.message).toMatch(/\bcanceled\b/);

        done();
    }

    compiler
    .on('end', finish)
    .on('error', (err) => {
        error = err;

        finish();
    })
    .watch();

    compiler.unwatch();
});
