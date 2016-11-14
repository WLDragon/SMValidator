# SMValidator(strong muscle validator)

## Features
- Less than 10KB

- No dependencies

- Customizable rules messages and styles

- Support bootstrap and semantic

- Useable RegExp on html

- Support IE8+

## Tutor And Documents
- [中文版教程](https://wldragon.github.io/SMValidator/tutor/tutor1.html)

- [Quick Start](https://github.com/WLDragon/SMValidator/wiki/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

## Demos
- Simplest demo

``` html
<input type="text" data-rule="required">
<script>
  new SMValidator('input');
</script>
```

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

## Download
- Use npm ```npm install --save SMValidator```

- Use bower ```bower install SMValidator```

## Notice
- checkbox invalid in IE8

- `<select>` only validate on blur in IE9~11, because it's not support oninput

## About dist
- `SMValidator.js` source with config

- `SMValidator.min.js` the minify for SMValidator

- `SMValidator.pure.min.js` without config, set rule and style by yourself

## TODO
1. 英文教程

2. 添加vue插件版本

## Reference
some inspirations comes from: [nice-validator](https://github.com/niceue/nice-validator)