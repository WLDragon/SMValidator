# sm-validator
一个简单的表单验证库，不依赖任何第三方库

- 可手动或及时验证，手动验证可实现异步

- 传入form或input绑定，如果是input的话有些配置失效

- 全局或局部配置验证规则

- 规则可以通过js或html来配置

- failClass验证失败时添加的类，局部配置中与input对应

- failSelector验证失败时显示的element，忽略时则在input后面添加span

- 全局配置
``` javascript
SMValidator.config({
  failHtml: '<span style="color:#c33;"></span>',
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
  rules: { /*和全局配置一样*/},
  failHtml: '<span></span>',
  failStyle: null,
  fields: {
    field1Name: [/abc/, 'message'],
    field2Name: function(val){ return /abc/.test(val) || 'message';},
    field3Name: '/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul',
    field4Name: {
      rule: 'rule1;rule2(0,10)'|Array|Function,
      failSelector: '',
      failHtml: '',
      failStyle: null, //如果设置为false则不使用任何样式
      failClass: '',
      blur: false,
      manul: false //是否手动验证，默认值为false
    }
  },
  submit: function(valid, form) {
    //如果设置了commit属性，且querySelector中有存在form
    //则需要手动提交表单
    if(valid) form.submit();
  }
})
//设置了manul:true则需要手动验证
SMValidator.validate([input]/selector);
```

- html配置
```
<input data-rule="/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul">
```

- 优先级
html规则优先于js规则，局部规则优先于全局规则，fields里的属性优先于外部属性

# TODO
1. 服务器验证

2. 添加required,length等内置规则

3. 完善demo和文档、注释

4. 考虑添加其他表单的验证

# 参考
nice-validator
