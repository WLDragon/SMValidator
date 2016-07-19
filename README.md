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

# 文档
[快速开始](https://github.com/WLDragon/sm-validator/wiki/%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

# TODO
1. 详细的API说明

2. ~~服务器验证~~

3. ~~添加checkbox,radio,select,textarea的验证~~

4. 测试用例及浏览器兼容测试

5. ~~添加失败时定位表单功能~~

6. 英文文档

7. ~~添加npm和bower安装方式~~

8. ~~去掉#!@等特殊符号，使用类似规则方法名实现~~

9. ~~修改range规则，支持负数范围，添加email,number,equal,length等规则作为范例，不内嵌到内核~~

10. ~~添加几套UI作为demo，默认选项都没有值，需要添加自定义项目~~

11. 添加jquery插件版本

12. ~~添加reset复位到原始状态的功能~~

# 参考
部分灵感来自于：[nice-validator](https://github.com/niceue/nice-validator)