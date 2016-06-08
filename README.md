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
SMValidator.rules({
  rule1: [/abc/, 'message'],
  rule2: function(val, param2, param3, ...) {
      return /abc/.test(val) || 'message'
  }
})
```

8. js局部配置
``` javascript
var smv = new SMValidator('querySelector', {
  blur: false, //如果为true，则onBlur事件时验证，默认是input事件验证
  manul: false, //如果为true，则所有fields都手动验证，blur设置失效
  rules: { /*和全局配置一样*/},
  fields: {
    field1Name: String|Function|Array,
    field2Name: '/abc/;rule1;rule2(0,10);rule3:不能为空;<errSelector>;{errClass}', //String格式的规则
    field3Name: {
      rule: RegExp|Function,
      errSelector: '',
      errClass: '',
      message: '',
      manul: false //是否手动验证，默认值为false
    }
  }
})
//设置了manul:true则需要手动验证
smv.test() //验证全部manual为false的表单
smv.test(fieldName) //单独验证一个表单
smv.test([field1Name, field2Name]) //验证数组里的表单
```

9. html配置
```
<input data-rule="/abc/;rule1;rule2(0,10);rule3:不能为空;$errSelector;*errClass;@blur;@manul">
```

# 参考
nice-validator
