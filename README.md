# sm-validator
>一个非常容易使用的表单验证工具

1. 轻量，minify小于5KB

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

![扫一扫](https://wldragon.github.io/sm-validator/link.png)

# 选项及说明
## 全局选项
``` javascript
SMValidator.config({
  blur: false,  //是否焦点离开时验证
  manul: false,  //是否手动使用js验证
  failHtml: '<span style="color:#c00;"></span>',  //显示消息的模板，自动添加到input的后面
  failClass: '',  //验证失败时给input添加的样式类名
  failStyle: {
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
  failHtml: '',
  failStyle: null,
  failClass: '',
  rules: {},
  fields: {
    //fields里的属性名对应input的name，对应规则可以是数组、函数、字符串和对象四种类型
    //数组和函数规则请看上面的全局选项，fields里的所以函数规则的函数都只有val一个参数
    //字符串规则请看下面的HTML选项
    field1Name: [/abc/, 'message'],
    field2Name: function(val){ return /abc/.test(val) || 'message';},
    field3Name: '/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul',
    field4Name: {
      rule: 'rule1;rule2(0,10)'|Array|Function,  //字符串类型仅限于规则名，不支持/#!@修饰符
      failSelector: '',  //消息选择器，代替failHtml，可以是任意位置的标签，但只能显示预设的消息，不能显示规则返回的消息
      failStyle: null,
      failClass: '',
      failHtml: '',
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
<input data-rule="/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul">
```
- / 正则规则，/abc/message或/abc/i/message

- `# failSelector，例如##myDiv或#.failDisplay或#[name="failContent"]等等`

- ! failClass，例如!error

- @ blur或manul，只有@blur和@manul可选

- 其他都视为在局部或全局定义的规则

## 注意
1. 优先级：HTML选项 > field选项 > 局部选项 > 全局选项

2. failStyle可能会覆盖failClass的样式，可以使用failStyle=true来禁止使用默认的style

3. failSelector会使failHtml失效

4. manul会使blur失效

# 内置规则
1. required 必填项

2. range(+n) 长度大于n

3. range(-n) 长度小于n

4. range(n,m) 长度在n和m之间，如果你想指定长度5，则range(4,6)

# TODO
1. 详细的API说明

2. 服务器验证

3. 添加其他表单的验证

4. 测试用例及浏览器兼容测试

5. 如果是使用submit验证，失败时定位表单

6. 英文文档

7. 添加npm和bower安装方式

# 参考
部分灵感来自于：[nice-validator](https://github.com/niceue/nice-validator)