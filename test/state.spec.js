'use strict';

const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

afterEach(() => createCompiler.teardown());

it('should have correct state before and after a successful run', async () => {
    const compiler = createCompiler(configBasic);

    expect(compiler.isCompiling()).toBe(false);
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);

    const compilation = await compiler.run();

    expect(compilation).toBeDefined();
    expect(compiler.isCompiling()).toBe(false);
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(compilation);
});

it('should have correct state before and after a failed run', async () => {
    const compiler = createCompiler(configSyntaxError);

    expect.assertions(7);

    expect(compiler.isCompiling()).toBe(false);
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);

    try {
        await compiler.run();
    } catch (err) {
        expect(err).toBeDefined();
        expect(compiler.isCompiling()).toBe(false);
        expect(compiler.getError()).toBe(err);
        expect(compiler.getCompilation()).toBe(null);
    }
});

it('should have correct state before and after a successful watch run', (done) => {
    const compiler = createCompiler(configBasic);

    expect(compiler.isCompiling()).toBe(false);
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);

    compiler.watch((err, compilation) => {
        expect(err).toBe(null);
        expect(compilation).toBeDefined();
        expect(compiler.isCompiling()).toBe(false);
        expect(compiler.getError()).toBe(err);
        expect(compiler.getCompilation()).toBe(compilation);

        done();
    });

    expect(compiler.isCompiling()).toBe(true); // Takes some time to start compiling
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);
});

it('should have correct state before and after a failed watch run', (done) => {
    const compiler = createCompiler(configSyntaxError);

    expect(compiler.isCompiling()).toBe(false);
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);

    compiler.watch((err, compilation) => {
        expect(err).toBeDefined();
        expect(compilation).toBe(null);
        expect(compiler.isCompiling()).toBe(false);
        expect(compiler.getError()).toBe(err);
        expect(compiler.getCompilation()).toBe(null);

        done();
    });

    expect(compiler.isCompiling()).toBe(true); // Takes some time to start compiling
    expect(compiler.getError()).toBe(null);
    expect(compiler.getCompilation()).toBe(null);
});
