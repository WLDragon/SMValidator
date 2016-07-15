# sm-validator(small form validator)

1. 轻量，10KB以内

2. 方便，只有验证规则是必填，其余选项均可选

3. 灵活，可自定义规则、样式、验证时机、消息内容

4. 不依赖第三方库

5. 支持bootstrap样式

# 示例
``` html
<input type="text" data-rule="required">
<script>
  new SMValidator('input');
</script>
```

<table>
    <tr>
      <td><a href="https://wldragon.github.io/sm-validator/">复杂的例子</a></td>
      <td><a href="https://wldragon.github.io/sm-validator/bootstrap/">bootstrap样式例子</a></td>
      <td><a href="https://wldragon.github.io/sm-validator/semantic/">semantic样式例子</a></td>
    </tr>
    <tr>
      <td></td>
      <td><img src="https://wldragon.github.io/sm-validator/bootstrap/scan.jpg"></td>
      <td><img src="https://wldragon.github.io/sm-validator/semantic/scan.jpg"></td>
    </tr>
</table>

# 安装和使用
- 在github下载

- 使用npm/bower获取
```
npm install --save sm-validator
bower install sm-validator
```

- sm-validator使用umd规范，支持amd、commonjs和window.SMValidator使用方式

# 发布版本说明(dist/)
- SMValidator.js 带默认配置的源码

- SMValidator.min.js 带默认配置的minify

- SMValidator.pure.min.js 不带默认配置的minify，内置只有required规则，验证样式等需要自己配置，可参考src/config.js

# 选项及说明
## 全局选项
``` javascript
SMValidator.config({
  noServerMessage: '', //使用了server，但是还没手动验证时的默认提示消息
  requiredMessage: '', //required规则的提示，required规则不能覆盖
  server: false, //标志是否由服务器来验证，配置forceFlag来处理结果，一般不需要全局设置，而是针对特定的input来设置
  manul: false,  //是否手动使用js验证
  blur: false,  //是否焦点离开时验证
  failStyle: null,  //验证失败时给input添加的style属性，设置为true则禁用此属性
  failHtml: '',  //显示消息的html模板，自动添加到input的后面，如果是选择器则只会把消息填到选择的标签里
  failCss: ['error', '+error'],  //验证失败时给input添加的样式类名，+号表示往上一层，把样式添加到父标签
  passStyle: null,
  passHtml: '',
  passCss: '',
  rules: {
    rule1: [/abc/, 'message'],  //数组形式的规则，第一项是正则表达式，第二项是验证失败时显示的消息
    rule2: function(val, param2, param3, ...) {
        return /abc/.test(val) || 'message';  //函数形式的规则，第一个参数为input的值，其他参数可选
    }
  }
})

/**
设置了manul:true，需要手动验证
options {
  serverMessage: '', //传递服务器验证的消息
  forceFlag: 0, //强行设置验证结果，0没验证 1通过 2失败
  locate: false //是否定位到第一个验证失败的表单
}
*/
SMValidator.validate([input]｜selector, options);  //手动验证，可传入input数组或选择器描述符

//重新设置表单为没验证状态
SMValidator.reset([input]｜selector);  //可传入input数组或选择器描述符
```

## 局部选项
``` javascript
var smv = new SMValidator('querySelector', {
  server: false,
  manul: false,
  blur: false,
  failStyle: null,
  failHtml: '',
  failCss: '',
  passStyle: null,
  passHtml: '',
  passCss: '',
  rules: {},
  fields: {
    //fields里的属性名对应input的name，对应规则可以是数组、函数、字符串和对象四种类型
    //数组和函数规则请看上面的全局选项，fields里的所以函数规则的函数都只有val一个参数
    //字符串规则请看下面的HTML选项
    field1Name: [/abc/, 'message'],
    field2Name: function(val){ return /abc/.test(val) || 'message';},
    field3Name: '/abc/i/message;rule1;rule2(0,10);blur;manul;server',
    field4Name: 'required;failStyle(...);failCss(error,+error2);failHtml(!...);passStyle(...);passCss(...);passHtml(!...)',
    field5Name: {
      rule: 'rule1;rule2(0,10)'|Array|Function,  //字符串类型仅限于规则名，不支持failStyle等属性
      failStyle: null,
      failHtml: '',
      failCss: '',
      fail:null, //验证失败时的回调函数，绑定this为input
      passStyle: null,
      passHtml: '',
      passCss: '',
      pass: null, //成功时的回调函数，绑定this为input
      server: false,
      manul: false,
      blur: false
    }
  },
  submit: function(valid, form) {
    //如果设置了commit属性，且querySelector中存在form，则需要手动提交该form
    //所有input验证成功后valid为true
    if(valid) form.submit();
  }
});
```

## HTML选项
``` html
<input data-rule="/abc/i/message;rule1;rule2(0,10);blur;manul;server">
<input data-rule="required;failStyle(...);failCss(+..);failHtml(!...);passStyle(...);passCss(++.);passHtml(!...)">
```
- / 正则规则，/abc/message或/abc/i/message

- `rule1;rule2(0,10)`自定义验证规则的函数名，不带参数或带任意参数

- `failStyle(...)` eg. `failStyle({'color':'red'})`

- `failCss(...)` eg. `failCss(error,+error)`
  "+"表示样式应用到input的父节点，一个"+"表示往上一层，可以多个连在一起

- `failHtml(...)` eg. `failHtml(<div></div>)或failHtml(#divId)`
  "!"表示不使用规则的消息，只显示选择的html及其内容

- `blur、manul、server` 对应blur、manul和server属性

## 注意
1. 优先级：field选项 > 局部选项 > 全局选项

2. manul会使blur失效

3. server强制manul为true，即server为true时manul必然为true

# TODO
1. 详细的API说明

2. ~~服务器验证~~

3. 添加checkbox,select,textarea的验证

4. 测试用例及浏览器兼容测试

5. ~~添加失败时定位表单功能~~

6. 英文文档

7. ~~添加npm和bower安装方式~~

8. ~~去掉#!@等特殊符号，使用类似规则方法名实现~~

9. ~~修改range规则，支持负数范围，添加email,number,equal,length等规则作为范例，不内嵌到内核~~

10. 添加几套UI作为demo，默认选项都没有值，需要添加自定义项目

11. 添加jquery插件版本

12. ~~添加reset复位到原始状态的功能~~

# 参考
部分灵感来自于：[nice-validator](https://github.com/niceue/nice-validator)