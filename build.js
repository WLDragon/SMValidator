var fs = require('fs');
var uglify = require('uglify-js');
var version = require('./package.json').version;

var src = fs.readFileSync('./src/SMValidator.js', {encoding: 'utf-8'});
var cfg = fs.readFileSync('./src/config.js', {encoding: 'utf-8'});
//作者信息
var cp = '/*!'
        +'\n * SMValidator ' + version
        +'\n * Copyright (c) 2016 WLDragon(cwloog@qq.com)'
        +'\n * Released under the MIT License.'
        +'\n */';
//只有内核的纯净版
fs.writeFileSync('./dist/SMValidator.pure.min.js', cp + uglify.minify(src, {fromString: true}).code);
//带有默认配置的版本
var mix = src.replace('//DEFAULT-CONFIG-PLACEHOLDER', cfg);
fs.writeFileSync('./dist/SMValidator.js', cp + mix);
fs.writeFileSync('./dist/SMValidator.min.js', cp + uglify.minify(mix, {fromString: true}).code);