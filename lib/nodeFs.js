'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const { join } = require('path');

// The output of this function must have the same methods as MemoryFileSystem
// See https://github.com/webpack/memory-fs/blob/master/lib/MemoryFileSystem.js
module.exports = () => Object.assign({}, fs, { mkdirp, join });
