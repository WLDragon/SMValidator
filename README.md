# sm-validator
一个简单的表单验证库，不依赖任何第三方库

TODO:

1. 可手动或及时验证，手动验证可实现异步，传入true或false强制处理表单验证结果

2. 传入form或input绑定，如果是input的话有结配置失效

3. 全局或局部配置验证规则

4. 规则可以通过js或html来配置

5. errClass验证失败时添加的类，局部配置中与input对应

6. errSelector验证失败时显示的element，忽略时则在input后面添加span

7. 全局配置
``` javascript
SMValidator.config({
  rule1: [/abc/, 'message'],
  rule2: function(val, param2, param3, ...) {
      return /abc/.test(val) || 'message'
  }
})
```

8. js局部配置
``` javascript
new SMValidator('querySelector', {
  rules: { /*和全局配置一样*/},
  fields: {
    field1Name: String|Function|Array,
    field2Name: '/abc/;rule1;rule2(0,10);rule3:不能为空;<errSelector>;{errClass}', //String格式的规则
    field3Name: {
      rule: RegExp|Function,
      errSelector: '',
      errClass: '',
      message: ''
    }
  }
})
```

9. html配置
```
<input data-rule="/abc/;rule1;rule2(0,10);rule3:不能为空;<errSelector>;{errClass}">
```

# 参考
nice-validator
