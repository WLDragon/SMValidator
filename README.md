# SMValidator(strong muscle validator)

## Features
- Light weight

- No dependencies

- Customizable rules messages and styles

- Support bootstrap and semantic

- Useable RegExp on html

- Support IE8+

## Tutor And Documents
- [中文版教程](https://wldragon.github.io/SMValidator/tutor/tutor1.html)

- [English Tutor](https://wldragon.github.io/SMValidator/tutor/tutor-en1.html)

- [快速开始](https://github.com/WLDragon/SMValidator/wiki/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

## Preview
- **Required** (required rule in html)

``` html
<input type="text" data-rule="required">
```

- **RegExp** (using RegExp in html)

``` html
<input type="text" data-rule="/^[a-z]+$/i/Please input letters">
```

- **Your Style** (add .fail-error on input when validate failed)

``` html
<input type="text" data-rule="failCss(fail-error)">
```

- **Javascript** (use only js without data-rule)

``` javascript
new SMValidator('form', {
  rules: {
    //define a rule by RegExp
    onlyNumber: [/^-?\d+(\.{1}\d+)?$/, 'Please input letters'],
    //define a rule by Function
    greater: function(val, num) {
      return (val*1 > num*1) || 'Please input a number that greater than ' + num;
    }
  },
  fields: {
    //fieldName1 match input's name
    fieldName1: {
      required: true,
      rule: 'onlyNumber|greater(10)',
      failCss: 'fail-error'
    }
  }
});
```

## Demos
- [A complex demo](https://wldragon.github.io/SMValidator/)

- Support third-party UI framework
<table>
    <tr>
      <td><a href="https://wldragon.github.io/SMValidator/bootstrap/">bootstrap demo</a></td>
      <td><a href="https://wldragon.github.io/SMValidator/semantic/">semantic demo</a></td>
    </tr>
    <tr>
      <td><img src="https://wldragon.github.io/SMValidator/bootstrap/scan.png"></td>
      <td><img src="https://wldragon.github.io/SMValidator/semantic/scan.png"></td>
    </tr>
</table>

## Install
- ```npm install --save SMValidator```

- ```bower install SMValidator```

## Notice
- checkbox invalid in IE8

- `<select>` only validate on blur in IE9~11, because it's not support oninput

## About dist
- `SMValidator.js` source with config

- `SMValidator.min.js` the minify for SMValidator.js

- `SMValidator.pure.min.js` without config, set rule and style by yourself

## Reference
some inspirations comes from: [nice-validator](https://github.com/niceue/nice-validator)