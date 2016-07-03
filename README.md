# sm-validator
>一个非常容易使用的表单验证工具

1. 轻量，minify在10KB以内

2. 方便，只有验证规则是必填，其余选项均可选

3. 灵活，可自定义规则、样式、验证时机、消息内容

4. 不依赖第三方库

# 示例
``` html
<input type="text" data-rule="required">
```
``` javascript
SMValidator.validate('input');
```

[查看详细例子](https://wldragon.github.io/sm-validator/)

# 安装
``` html
<script src="../SMValidator.min.js"></script>
```

# 选项及说明
## 全局选项
``` javascript
SMValidator.config({
  blur: false,  //是否焦点离开时验证
  manul: false,  //是否手动使用js验证
  html: '<span style="color:#c00;"></span>',  //显示消息的模板，自动添加到input的后面
  css: '',  //验证失败时给input添加的样式类名
  style: {
    color: '#c00',
    border: '1px solid #c00'
  },  //验证失败时给input添加的style属性，设置为true则禁用此属性
  rules: {
    rule1: [/abc/, 'message'],  //数组形式的规则，第一项是正则表达式，第二项是验证失败时显示的消息
    rule2: function(val, param2, param3, ...) {
        return /abc/.test(val) || 'message';  //函数形式的规则，第一个参数为input的值，其他参数可选
    }
  }
})
```

## 局部选项
``` javascript
var smv = new SMValidator('querySelector', {
  blur: false,
  manul: false,
  html: '',
  style: null,
  css: '',
  rules: {},
  fields: {
    //fields里的属性名对应input的name，对应规则可以是数组、函数、字符串和对象四种类型
    //数组和函数规则请看上面的全局选项，fields里的所以函数规则的函数都只有val一个参数
    //字符串规则请看下面的HTML选项
    field1Name: [/abc/, 'message'],
    field2Name: function(val){ return /abc/.test(val) || 'message';},
    field3Name: '/abc/i/message;rule1;rule2(0,10);#failSelector;!css;@blur;@manul', //弃用
    field3Name: '/abc/i/message;rule1;rule2(0,10);style(style);css(css);html(html);manul;blur',
    field4Name: {
      rules: 'rule1;rule2(0,10)'|Array|Function,  //字符串类型仅限于规则名，不支持/#!@修饰符
      style: null,
      css: '',
      html: '',
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

//设置了manul:true，需要手动验证
//@param {Boolean} ignoreManul 忽略manul设置
//@param {Boolean} resetRule 重新设置规则，如果动态修改了input的验证规则，可以使用此方法更新规则
smv.validate(ignoreManul, resetRule);  //实例验证
SMValidator.validate([input]｜selector, ignoreManul, resetRule);  //静态验证，可传入input数组或选择器描述符
```

## HTML选项
``` html
<input data-rule="/abc/i/message;rule1;rule2(0,10);style(style);css(css);html(html);blur;manul">
```
- `/abc/i/message`正则验证规则，eg. `/^[a-z]*$/小写字母`或`/^[a-z]*$/i/任意字母`

- `rule1;rule2(0,10)`自定义验证规则的函数名，不带参数或带任意参数

- `style(style)`自定义input样式，eg. `style({color:red})或style(true)`

- `css(css)`自定义input样式类名，eg. `css(error)`

- `html(html)`自定义显示消息的html，可以是选择器，eg. `html(<div></div>)或html(#divId)`

- `blur或manul`对应blur和manul属性

## 注意
1. 优先级：field选项 > 局部选项 > 全局选项

2. style可能会覆盖css的样式，可以使用style=true来禁止使用默认的style

3. manul会使blur失效

# 内置规则
1. required 必填项

~~2. range(n,) 数值大于n~~

~~3. range(,n) 数值小于n~~

~~4. range(n,m) 数值在n和m之间~~

~~5. range(n) 数值等于n~~

# TODO
1. 详细的API说明

2. 服务器验证

3. 添加checkbox,select,textarea的验证

4. 测试用例及浏览器兼容测试

5. 如果是使用submit验证，失败时定位表单

6. 英文文档

7. 添加npm和bower安装方式

8. 去掉#!@等特殊符号，因为特殊符号不能直观表达用途，所以改成关键字形式，跟规则名类似，但有特殊用途

9. 修改range规则，支持负数范围，添加email,number,password compare,length等规则作为范例，不内嵌到内核

10. failselector也支持显示规则提供的消息，默认不显示

11. 添加几套UI作为demo

12. 添加jquery插件版本

# 参考
部分灵感来自于：[nice-validator](https://github.com/niceue/nice-validator)