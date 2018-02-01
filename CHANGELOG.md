# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.0"></a>
# [3.0.0](https://github.com/moxystudio/webpack-sane-compiler/compare/v2.1.0...v3.0.0) (2018-02-01)


### Features

* allow invalidating a compilation in watch mode ([7261da6](https://github.com/moxystudio/webpack-sane-compiler/commit/7261da6))


### BREAKING CHANGES

* `.watch` no longer returns the compiler and now returns a function that, when called, will stop an ongoing compilation and start a new one. It also emits the `invalidate` event.



<a name="2.1.0"></a>
# [2.1.0](https://github.com/moxystudio/webpack-sane-compiler/compare/v2.0.0...v2.1.0) (2018-01-13)


### Features

* override compiler's `outputFileSystem` to a fully featured `fs` ([3f42d3c](https://github.com/moxystudio/webpack-sane-compiler/commit/3f42d3c))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/moxystudio/webpack-sane-compiler/compare/v1.0.0...v2.0.0) (2017-12-18)


### Bug Fixes

* fix error logic not being correct in some edge cases ([bb986d8](https://github.com/moxystudio/webpack-sane-compiler/commit/bb986d8))


### Features

* add duration to the compilation result ([e2c7dcb](https://github.com/moxystudio/webpack-sane-compiler/commit/e2c7dcb))


### BREAKING CHANGES

* the compiler now has the concept of compilation instead of status



<a name="1.0.0"></a>
# 1.0.0 (2017-12-13)


### Features

* Initial implementation ([abc34f1](https://github.com/moxystudio/webpack-sane-compiler/commit/abc34f1))
