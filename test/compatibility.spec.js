'use strict';

const webpack = require('webpack');
const createCompiler = require('./util/createCompiler');
const configBasic = require('./configs/basic');
const saneCompiler = require('../');

afterEach(() => createCompiler.teardown());

function createProxyCompiler() {
    const webpackCompiler = webpack(createCompiler.uniquifyConfig(configBasic));
    const handler = {
        get(target, key) {
            return target[key];
        },
        has(trapTarget, key) {
            if (key === 'hooks') {
                return false;
            }

            return Reflect.has(trapTarget, key);
        },
    };
    const proxywebPackCompiler = new Proxy(webpackCompiler, handler);
    const compiler = saneCompiler(proxywebPackCompiler);

    return compiler;
}

it('Should be able to accept plugin isntead of hooks', () => {
    const compiler = createProxyCompiler(configBasic);

    compiler.watch();

    const promise = compiler.unwatch();

    expect(promise).toBeDefined();
    expect(promise instanceof Promise).toBe(true);
});
