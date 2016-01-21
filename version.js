#!/usr/bin/env node

var pkg = require('./package.json')
var version = pkg.devDependencies['electron-prebuilt'].replace('^', '')

if (require.main === module) console.log(version)

module.exports = version
