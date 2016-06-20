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

    function SMValidator(selectors, options) {
        this.blur = options.blur;
        this.manul = options.manul;
        this.rules = options.rules || {};
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

    /**全局公共验证规则 */
    var globalRules = {};
    /**公共显示错误的html */
    var globalErrorHtml = '<span></span>';

    /**设置全局公共验证规则 */
    SMValidator.rules = function (options) {
        for(var k in options) {
            globalRules[k] = parseRule(options[k]);
        }
    }
    /**手动验证表单 */
    SMValidator.test = function () {
        
    }

    function toggleClass(input, className, isAdd) {
        if(isAdd) console.log('添加样式：' + className);
        else console.log('去掉样式：' + className);
    }

    function toggleMessage(input, selector, isShow, message) {
        if(isShow) console.log('显示错误：' + message);
        else console.log('隐藏：' + message);
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
        item.rule = this.rules[str] || globalRules[str];
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
                //显示错误消息的标签选择器
                validator.errSelector = body;
            }else if(head === '!') {
                //表示错误的样式名
                validator.errClass = body;
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
     * 3、String '/abc/i/message;rule1;rule2(0,10);#errSelector;!errClass;@blur;@manul'
     * 4、Object {
     *               rule: 'rule1;rule2(0,10)'|Array|Function,
     *               errSelector: '',
     *               errClass: '',
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
            
            if(msg === true) {//验证成功
                //去掉错误样式，隐藏错误提示
                if(item.errClass) toggleClass(input, item.errClass, false);
                if(item.errSelector){
                    toggleMessage(input, item.errSelector, false);
                }else {
                    
                }
            }else {//验证失败
                //添加错误样式，显示错误提示
                if(item.errClass) toggleClass(input, item.errClass, true);
                if(item.errSelector) {
                    toggleMessage(input, item.errSelector, true, msg);
                }else {
                    //TODO 如果没有指定显示错误的位置，则手动创建
                    //TODO 考虑是否提供用户自定义插入的标签的功能
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