# webpack-sane-compiler

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] 

[npm-url]:https://npmjs.org/package/webpack-sane-compiler
[npm-image]:http://img.shields.io/npm/v/webpack-sane-compiler.svg
[downloads-image]:http://img.shields.io/npm/dm/webpack-sane-compiler.svg
[travis-url]:https://travis-ci.org/moxystudio/webpack-sane-compiler
[travis-image]:http://img.shields.io/travis/moxystudio/webpack-sane-compiler/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/webpack-sane-compiler
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/webpack-sane-compiler/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/webpack-sane-compiler
[david-dm-image]:https://img.shields.io/david/moxystudio/webpack-sane-compiler.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/webpack-sane-compiler?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/webpack-sane-compiler.svg

A webpack compiler wrapper that provides a nicer API.


## Installation

`$ npm install webpack-sane-compiler --save-dev`

The current version works with webpack v2, v3 and v4.


## Usage

```js
const webpack = require('webpack');
const saneWebpack = require('webpack-sane-compiler');

const webpackCompiler = webpack(/* config */);
const compiler = saneWebpack(webpackCompiler);
```

Alternatively, you may pass a config directly instead of a webpack compiler:

```js
const compiler = saneWebpack(/* config */);
```

The compiler inherits from [EventEmitter](https://nodejs.org/api/events.html) and emits the following events:

| Name   | Description   | Arguments |
| ------ | ------------- | -------- |
| begin | Emitted when a compilation starts | |
| error | Emitted when the compilation fails | (err: Error) |
| end | Emitted when the compilation completes successfully | ({ stats: WebpackStats, duration: Number }) |
| invalidate | Emitted when the function return by .watch is called | |

```js
compiler
.on('begin', () => console.log('Compilation started'))
.on('end', ({ stats, duration }) => {
    console.log(`Compilation finished successfully (${duration}ms)`);
    console.log('Stats', stats);
})
.on('invalidate', () => {
    console.log('Compilation canceled. Starting new compilation.')
})
.on('error', (err) => {
    console.log('Compilation failed')
    console.log(err.message);
    err.stats && console.log(err.stats.toString());
})
```

### .run()

Returns a Promise that fulfils with a `stats` object or is rejected with an error.

This is similar to webpack's run() method, except that it returns a promise which gets rejected if stats contains errors.

```js
compiler.run()
.then(({ stats, duration }) => {
    // stats is the webpack stats
    // duration is the time it took to compile
})
.catch((err) => {
    // err = {
    //   message: 'Error message',
    //   [stats]: <webpack-stats>
    // }
});
```

### .watch([options], [handler])

Starts watching for changes and compiles on-the-fly.   
Returns a function that, when called, will stop an ongoing compilation and start a new one.

Calls `handler` everytime the compilation fails or succeeds.
This is similar to webpack's watch() method, except that `handler` gets called with an error if stats contains errors.

Available options:

| Name   | Description   | Type     | Default |
| ------ | ------------- | -------- | ------- |
| poll | Use polling instead of native watchers | boolean | false |
| aggregateTimeout | Wait so long for more changes (ms) | err | 200 |

```js
const invalidate = compiler.watch((err, { stats, duration }) => {
    // err = {
    //   message: 'Error message',
    //   [stats]: <webpack-stats>
    // }
    // stats is the webpack stats
    // duration is the time it took to compile
});

if (someReasonToTriggerARecompilation) {
    invalidate();
}
```

### .unwatch()

Stops watching for changes.   
Returns a promise that fulfills when done.


### .resolve()

Resolves the compilation result.

The promise gets immediately resolved if the compiler has finished or failed.  
Otherwise waits for a compilation to be done before resolving the promise.

```js
compiler.resolve()
.then(({ stats, duration }) => {
    // stats is the webpack stats
    // duration is the time it took to compile
})
.catch((err) => {
    // err = {
    //   message: 'Error message',
    //   [stats]: <webpack-stats>
    // }
});
```


### .isCompiling()

Returns a boolean indicating a compilation is currently in progress.


### .getError()

Returns the compilation error or null if none.


### .getCompilation()

Get the compilation result which is an object that contains `stats` and `duration`.   
Returns null if the last compilation failed or if it's not yet available.


### Other properties

| Name   | Description   | Type     |
| ------ | ------------- | -------- |
| webpackCompiler | The unrapped webpack compiler | [Compiler](https://github.com/webpack/webpack/blob/bd753567da1248624beaaea14af31d6dbe303411/lib/Compiler.js#L153) |
| webpackConfig | The webpack config | object |

Accessing webpack compiler public methods is NOT allowed and will throw an error.

Note: `webpackCompiler`'s `outputFileSystem` property is overridden to a [fully featured node fs](/lib/nodeFs.js) implementation as opposed to its default value which only packs a [subset](https://github.com/webpack/webpack/blob/c71fd05f98a752753b9450f590c970b76379803d/lib/node/NodeOutputFileSystem.js) of the features.

## Related projects

You may also want to look at:

- [webpack-sane-compiler-reporter](https://github.com/moxystudio/webpack-sane-compiler-reporter): Beautiful reporting for this compiler
- [webpack-sane-compiler-notifier](https://github.com/moxystudio/webpack-sane-compiler-notifier): Receive OS notifications for this compiler
- [webpack-isomorphic-compiler](https://github.com/moxystudio/webpack-isomorphic-compiler): A compiler that makes your life easier if you are building isomorphic webpack powered apps


## Tests

`$ npm test`   
`$ npm test -- --watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
