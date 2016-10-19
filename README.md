# SMValidator(small form validator)

## QQ群(点击添加) 
[585674463](http://jq.qq.com/?_wv=1027&k=40WxN5s)

## Features
- Less than 10KB

- No dependencies

- Customizable rules messages and styles

- Support bootstrap and semantic

- Useable RegExp on html

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

## Documents
[Quick Start](https://github.com/WLDragon/SMValidator/wiki/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

## About dist
- `SMValidator.js` source with config

- `SMValidator.min.js` the minify for SMValidator

- `SMValidator.pure.min.js` without config, set rule and style by yourself

## TODO
1. 测试用例及浏览器兼容测试

2. 英文文档

3. 添加vue插件版本

## Reference
some inspirations comes from: [nice-validator](https://github.com/niceue/nice-validator)