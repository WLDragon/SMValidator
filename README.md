# sm-validator(small form validator)

## Features
- Less than 10KB

- No dependencies

- Customizable rules messages and styles

- Support bootstrap and semantic

- Useable RegExp on html

- Support AMD CommonJS and Global

## Demos
- Simplest demo

``` html
<input type="text" data-rule="required">
<script>
  new SMValidator('input');
</script>
```

- [A complex demo](https://wldragon.github.io/sm-validator/)

- Support third-party UI framework
<table>
    <tr>
      <td><a href="https://wldragon.github.io/sm-validator/bootstrap/">bootstrap demo</a></td>
      <td><a href="https://wldragon.github.io/sm-validator/semantic/">semantic demo</a></td>
    </tr>
    <tr>
      <td><img src="https://wldragon.github.io/sm-validator/bootstrap/scan.jpg"></td>
      <td><img src="https://wldragon.github.io/sm-validator/semantic/scan.jpg"></td>
    </tr>
</table>

## Download
- [From Github](https://github.com/WLDragon/sm-validator/archive/0.10.1.zip)

- Use npm ```npm install --save sm-validator```

- Use bower ```bower install sm-validator```

## Documents
[Quick Start](https://github.com/WLDragon/sm-validator/wiki/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

## About dist
- `SMValidator.js` source with config

- `SMValidator.min.js` the minify for SMValidator

- `SMValidator.pure.min.js` without config, set rule and style by yourself

## TODO
1. 详细的API说明

2. 测试用例及浏览器兼容测试

3. 英文文档

4. 添加jquery插件版本

5. fail和pass回调函数带规则序号，能识别是哪个规则，加一个强制验证所有规则的属性，而不是验证失败就退出

## Reference
some inspirations comes from: [nice-validator](https://github.com/niceue/nice-validator)