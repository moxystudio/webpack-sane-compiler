'use strict';

const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');

afterEach(() => createCompiler.teardown());

it('should not throw if iddling', () => {
    const compiler = createCompiler(configBasic);

    compiler.assertIdle();
});

it('should throw if running', async () => {
    const compiler = createCompiler(configBasic);

    const promise = compiler.run();

    expect(() => compiler.assertIdle()).toThrow('Compiler is running');
    expect(() => compiler.assertIdle('run')).toThrow('Compiler is running, you can only call \'run\' when the compiler is idle');

    await promise;
});

it('should throw if watching', () => {
    const compiler = createCompiler(configBasic);

    compiler.watch();

    expect(() => compiler.assertIdle()).toThrow('Compiler is watching');
    expect(() => compiler.assertIdle('watch')).toThrow('Compiler is watching, you can only call \'watch\' when the compiler is idle');
});
