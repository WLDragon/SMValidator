/*!
 * SMValidator.js
 * Copyright (c) 2016 WLDragon
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.SMValidator = factory());
} (this, function () {
    'use strict';

    var document = window.document;
    /**全局配置 */
    var config = {
        failHtml: '<span style="color:#c33;"></span>',
        failStyle: {
            color: '#c33',
            border: '1px solid #c33'
        },
        rules: {}
    };

    function SMValidator(selectors, options) {
        this.blur = options.blur;
        this.manul = options.manul;
        this.rules = options.rules || {};
        this.failHtml = options.failHtml || config.failHtml;
        this.failStyle = options.failStyle || config.failStyle;
        this.fields = {};
        for(var k in options.fields) {
            this.fields[k] = this.parseRule(options.fields[k]);
        }
        var els = document.querySelectorAll(selectors);
        for (var i = els.length - 1; i >= 0; i--) {
            var el = els[i];
            if(el.tagName === 'FORM') {
                for (var j = el.length - 1; j >= 0; j--) {
                    this.bindInput(el[j]);
                }
            }else if(el.tagName === 'INPUT') {
                this.bindInput(el);
            }
        }
    }

    /**设置全局公共验证规则 */
    SMValidator.config = function (options) {
        if(options.failHtml) config.failHtml = options.failHtml;
        if(options.rules) {
            for(var k in options.rules) {
                config.rules[k] = parseRule(options.rules[k]);
            }
        }
    }
    /**手动验证表单 */
    SMValidator.test = function () {
        
    }

    var _proto = SMValidator.prototype;
    _proto.bindInput = function(input) {
        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input.__SMRule__ = item;
            if(!item.blur) item.blur = this.blur;
            if(!item.manul) item.manul = this.manul;

            if(item.failStyle !== false) {
                //设置验证失败后input的样式及记录原始样式
                if(!item.failStyle) {
                    item.failStyle = this.failStyle || config.failStyle;
                }
                item.oldStyle = {};
                for(var k in item.failStyle) {
                    item.oldStyle[k] = input.style[k];
                }
            }
            //如果规则里带有failSelector且可以查询出对应的Element
            //则使用该Element作为显示消息的容器
            //否则使用fialHtml生成Element作为容器
            if(item.failSelector) {
                var es = document.querySelectorAll(item.failSelector);
                if(es.length) {
                    item.failSelector = es;
                    //跳出函数，不执行下面创建failHtml对象的代码
                    return;
                }else {
                    item.failSelector = null;
                }
            }
            //如果failSelector不存在或查询失败则执行下面代码自动生成显示失败信息的容器
            if(!item.failHtml) {
                item.failHtml = this.failHtml || config.failHtml;
            }
            var div = document.createElement('div');
            div.innerHTML = item.failHtml;
            item.failHtml = div.childNodes[0];
            input.parentNode.insertBefore(item.failHtml, input.nextElementSibling);
        }
    }

    _proto.parseFunctionString = function(str) {
        var item = {};
        var begin = str.indexOf('(');
        //如果带有参数，参数不可能在0的位置
        if(begin > 0) {
            var end = str.indexOf(')');
            item.params = str.substring(begin + 1, end).split(',');
            str = str.substring(0, begin);
        }
        item.rule = this.rules[str] || config[str];
        return item;
    }

    _proto.parseString = function(str) {
        var validator = {rules: []};
        var items = str.split(';');
        for(var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            var head = item.charAt(0);
            var body = item.substring(1);
            if(head === '/') {
                //正则
                var a = body.split('/');
                if(a.length === 2) {
                    //没有修饰符i
                    validator.rules.push({rule: new RegExp(a[0]), message: a[1]});
                }else if(a.length === 3) {
                    //带有修饰符i
                    validator.rules.push({rule: new RegExp(a[0], 'i'), message: a[2]});
                }
            }else if(head === '#') {
                //显示失败消息的标签选择器
                validator.failSelector = body;
            }else if(head === '!') {
                //表示失败的样式名
                validator.failClass = body;
            }else if(head === '@') {
                //内建属性
                validator[body] = true;
            }else {
                //函数规则名
                validator.rules.push(this.parseFunctionString(item));
            }
        }
        return validator;
    }

    /**
     * 解析验证规则，有四种类型
     * 1、Array [/abc/, 'message']
     * 2、Function function(val){ return /abc/.test(val) || 'message';}
     * 3、String '/abc/i/message;rule1;rule2(0,10);#failSelector;!failClass;@blur;@manul'
     * 4、Object {
     *               rule: 'rule1;rule2(0,10)'|Array|Function,
     *               failSelector: '',
     *               failClass: '',
     *               blur: false,
     *               manul: false //是否手动验证，默认值为false
     *           }
     */
    _proto.parseRule = function(item) {
        if(item instanceof Array) {
            return {rules: [{rule: item[0], message: item[1]}]};
        }else if(item instanceof Function) {
            return {rules: [{rule: item}]};
        }else if(typeof item === 'string') {
            return this.parseString(item);
        }else if(typeof item === 'object') {
            if(item.rule instanceof Array) {
                item.rules = [{rule: item.rule[0], message: item.rule[1]}];
            }else if(item.rule instanceof Function) {
                item.rules = [{rule: item.rule}];
            }else if(typeof item.rule === 'string') {
                var a = item.rule.split(';');
                item.rules = [];
                for(var i = a.length - 1; i >= 0; i--) {
                    item.rules.push(this.parseFunctionString(a[i]));
                }
            }
            delete item.rule;
            return item;
        }
    }

    /**
     * 验证通过时去掉样式，验证失败时添加样式
     * @param input
     * @param failClassName 设置的样式名
     * @param isPass 是否验证通过
     */
    function toggleClass(input, failClassName, isPass) {
        var cns = input.className.split(' ');
        var i = cns.indexOf(failClassName);
        if(isPass && i > -1) {
            cns.split(i, 1);
            input.className = cns.join(' ');
        }else if(!isPass && i === -1){
            input.className += ' ' + failClassName;
        }
    }

    function toggleSelector(input, selectors, isPass) {
        for(var selector in selectors) {
            selector.style.display = isPass ? '' : 'none';
        }
    }

    function applyStyle(input, style) {
        for(var k in style) {
            input.style[k] = style[k];
        }
    }

    function validate(input) {
        //暂时只支持text的验证
        if(input.type === 'text') {
            var item = input.__SMRule__;
            var msg = true;
            for(var i = item.rules.length - 1; i >= 0; i--) {
                var r = item.rules[i];
                if(r.rule instanceof RegExp) {
                    if(!r.rule.test(input.value)) {
                        msg = r.message;
                        break;
                    }
                }else {
                    if(r.params) {
                        var params = [input.value].concat(r.params);
                        msg = r.rule.apply(null, params);
                    }else {
                        msg = r.rule.call(null, input.value);
                    }
                    if(msg !== true) break;
                }
            }
            
            if(msg === true) {
                //验证成功，去掉失败样式，隐藏失败提示
                if(item.failClass) toggleClass(input, item.failClass, true);
                if(item.failStyle) applyStyle(input, item.oldStyle);
                if(item.failSelector){
                    toggleSelector(input, item.failSelector, true);
                }else {
                    item.failHtml.style.display = 'none';
                }
            }else {
                //验证失败，添加失败样式，显示失败提示
                if(item.failClass) toggleClass(input, item.failClass, false);
                if(item.failStyle) applyStyle(input, item.failStyle);
                if(item.failSelector) {
                    toggleSelector(input, item.failSelector, false);
                }else {
                    item.failHtml.innerText = msg;
                    item.failHtml.style.display = '';
                }
            }
        }
    }

    //事件代理
    var on = document.addEventListener ? document.addEventListener : document.attachEvent;
    var eventType = ('oninput' in document) ? 'input' : 'propertychange';
    on.call(document, eventType, function(e){
        var input = e.target;
        if(input.__SMRule__ && !input.__SMRule__.manul && !input.__SMRule__.blur) {
            validate(input);
        }
    });
    on.call(document, 'change', function(e){
        var input = e.target;
        if(input.__SMRule__ && !input.__SMRule__.manul && input.__SMRule__.blur) {
            validate(input);
        }
    });

    return SMValidator;
}));