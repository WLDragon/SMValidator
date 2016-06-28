# sm-validator
1. 轻量，minify小于5KB

2. 方便，规则API简洁易用

3. 灵活，可自定义规则、样式、验证时机、消息内容

4. 不依赖任何第三方库

- 简单的示例
```
<input type="text" data-rule="required">
SMValidator.validate('input');
```

- 全局配置
``` javascript
SMValidator.config({
  blur: false,
  manul: false,
  failHtml: '<span style="color:#c33;"></span>',
  failClass: '',
  failStyle: {
    color: '#c33',
    border: '1px solid #c33'
  },
  rules: {
    rule1: [/abc/, 'message'],
    rule2: function(val, param2, param3, ...) {
        return /abc/.test(val) || 'message';
    }
  }
})
```

- js局部配置
``` javascript
var smv = new SMValidator('querySelector', {
  blur: false, //如果为true，则change事件验证，默认是input/propertychange事件验证
  manul: false, //如果为true，则所有fields都手动验证，blur设置失效
  failHtml: '<span></span>',
  failStyle: null,
  failClass: '',
  rules: {},
  fields: {
    field1Name: [/abc/, 'message'],
    field2Name: function(val){ return /abc/.test(val) || 'message';},
    field3Name: '/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul',
    field4Name: {
      rule: 'rule1;rule2(0,10)'|Array|Function,
      failSelector: '',
      failHtml: '',
      failStyle: null, //如果设置为false则不使用任何样式
      failClass: '', //如果failClass有值且failStyle没值，则failStyle不使用全局默认值
      blur: false,
      manul: false //是否手动验证，默认值为false
    }
  },
  submit: function(valid, form) {
    //如果设置了commit属性，且querySelector中有存在form
    //则需要手动提交表单
    if(valid) form.submit();
  }
});
//设置了manul:true则需要手动验证
smv.validate(ignoreManul, resetRule);
SMValidator.validate([input]/selector, ignoreManul, resetRule);
```

- html配置
```
<input data-rule="/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul">
```

- 优先级
局部规则优先于全局规则，fields里的属性优先于配置属性

# TODO
1. 服务器验证

2. 考虑添加其他表单的验证


# 参考
部分灵感来自于：nice-validator
