var fs = require('fs');
var uglify = require('uglify-js');
var version = require('./package.json').version;

var src = fs.readFileSync('./SMValidator.js', {encoding: 'utf-8'});
var cp = '/*!'
        +'\n * SMValidator.js ' + version
        +'\n * Copyright (c) 2016 WLDragon(cwloog@qq.com)'
        +'\n */';

fs.writeFileSync('./SMValidator.min.js', cp + uglify.minify(src, {fromString: true}).code);