'use strict';

const pSettle = require('p-settle');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const configSyntaxError = require('./configs/syntax-error');

describe('.resolve()', () => {
    afterEach(() => createCompiler.teardown());

    it('should fulfill immediately if the compiler has stats', () => {
        const compiler = createCompiler(configBasic);

        return compiler
        .run()
        .then((stats) => (
            compiler
            .resolve()
            .then((resolvedStats) => {
                expect(resolvedStats).toBe(stats);
            })
        ));
    });

    it('should reject immediately if the compiler has an error', () => {
        const compiler = createCompiler(configSyntaxError);

        return compiler
        .run()
        .then(() => {
            throw new Error('Should have failed');
        }, (err) => (
            compiler
            .resolve()
            .then(() => {
                throw new Error('Should have failed');
            }, (resolvedErr) => {
                expect(resolvedErr).toBe(err);
            })
        ));
    });

    it('should wait and fulfill after a successful compilation', () => {
        const compiler = createCompiler(configBasic);

        return Promise.all([
            compiler.run(),
            compiler.resolve(),
        ])
        .then(([stats, resolvedStats]) => {
            expect(resolvedStats).toBe(stats);
        });
    });

    it('should wait and reject after a failed compilation', () => {
        const compiler = createCompiler(configSyntaxError);

        return pSettle([
            compiler.run(),
            compiler.resolve(),
        ])
        .then(([stats, resolvedStats]) => {
            expect(stats.isRejected).toBe(true);
            expect(resolvedStats.isRejected).toBe(true);
            expect(stats.reason).toBe(resolvedStats.reason);
        });
    });
});
