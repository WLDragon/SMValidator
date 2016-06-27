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
    
    //事件代理
    var on = document.addEventListener ? document.addEventListener : document.attachEvent;
    var eventType = ('oninput' in document) ? 'input' : 'propertychange';
    on.call(document, eventType, function(e){
        var input = e.target;
        if(input._SMRule_ && !input._SMRule_.manul && !input._SMRule_.blur) {
            validate(input);
        }
    });
    on.call(document, 'change', function(e){
        var input = e.target;
        if(input._SMRule_ && !input._SMRule_.manul && input._SMRule_.blur) {
            validate(input);
        }
    });

    function SMValidator(selectors, options) {
        if(selectors) {
            if(!options) options = {};
            this.blur = options.blur;
            this.manul = options.manul;
            this.submit = options.submit;
            this.rules = options.rules || {};
            this.failHtml = options.failHtml || config.failHtml;
            this.failStyle = options.failStyle || config.failStyle;
            //解析fields字段记录的规则
            this.fields = {};
            for(var k in options.fields) {
                this.fields[k] = this.parseRule(options.fields[k]);
            }
            
            this.queryInput(selectors);
        }
    }

    var _proto = SMValidator.prototype;
    /**提取选择器选择的input */
    _proto.queryInput = function(selector, resetRule) {
        var self = this;
        var inputs = [];
        var els = document.querySelectorAll(selectors);
        for (var i = els.length - 1; i >= 0; i--) {
            var el = els[i];
            if(el.tagName === 'FORM') {
                el.novalidate = 'novalidate';
                var ins = [];
                for (var j = el.length - 1; j >= 0; j--) {
                    self.bindInput(el[j], resetRule);
                    ins.push(el[j]);
                }
                inputs.concat(ins);
                //如果设置了submit属性，则阻止Form默认的提交行为，回调submit方法
                if(self.submit && ins.length) {
                    el._SMInputs_ = ins;
                    on.call(el, 'submit', function(e) {
                        e.preventDefault();
                        var result = SMValidator.validate(e.target._SMInputs_, true);
                        self.submit(result, e.target);
                    });
                }
            }else if(el.tagName === 'INPUT') {
                self.bindInput(el);
                inputs.push(el);
            }
        }
        return inputs;
    }
    /**把规则绑定到input上 */
    _proto.bindInput = function(input, resetRule) {
        //如果已经绑定要规则，则不重复处理，除非指明重设规则
        if(input._SMRule_ && !resetRule) return;

        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input._SMRule_ = item;
            //只有当failStyle明确为false时才不使用
            if(item.failStyle !== false) {
                if(!item.failStyle && !item._isInit) {
                    //设置验证失败后input的样式
                    item.failStyle = this.failStyle || config.failStyle;
                }
                //记录原始样式，验证成功后恢复
                input._SMStyle_ = {};
                for(var k in item.failStyle) {
                    input._SMStyle_[k] = input.style[k];
                }
            }
            //fields里的规则可能会被重复用到，如果已经初始化过的不重复处理
            if(!item._isInit) {
                item._isInit = true;
                if(!item.blur) item.blur = this.blur;
                if(!item.manul) item.manul = this.manul;

                //如果规则里带有failSelector且可以查询出对应的Element
                //则使用该Element的文本信息
                //否则使用fialHtml生成Element作为容器，显示规则对应的消息
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
                item._useFailHtml = true;
                if(!item.failHtml) {
                    item.failHtml = this.failHtml || config.failHtml;
                }
            }

            if(item._useFailHtml) {
                var div = document.createElement('div');
                div.innerHTML = item.failHtml;
                input._failHtml_ = div.childNodes[0];
                input.parentNode.insertBefore(input._failHtml_, input.nextElementSibling);
            }
        }
    }

    _proto.parseFunctionString = function(str) {
        var fun = {};
        var begin = str.indexOf('(');
        //如果带有参数，参数不可能在0的位置
        if(begin > 0) {
            var end = str.indexOf(')');
            fun.params = str.substring(begin + 1, end).split(',');
            str = str.substring(0, begin);
        }
        fun.rule = this.rules[str] || config.rules[str];
        return fun;
    }

    _proto.parseString = function(str) {
        var item = {rules: []};
        var statements = str.split(';');
        for(var i = statements.length - 1; i >= 0; i--) {
            var statement = statements[i];
            var head = statement.charAt(0);
            var body = statement.substring(1);
            if(head === '/') {
                //正则
                var a = body.split('/');
                if(a.length === 2) {
                    //没有修饰符i
                    item.rules.push({rule: new RegExp(a[0]), message: a[1]});
                }else if(a.length === 3) {
                    //带有修饰符i
                    item.rules.push({rule: new RegExp(a[0], 'i'), message: a[2]});
                }
            }else if(head === '#') {
                //显示失败消息的标签选择器
                item.failSelector = body;
            }else if(head === '!') {
                //表示失败的样式名
                item.failClass = body;
            }else if(head === '@') {
                //内建属性blur或manul
                item[body] = true;
            }else {
                //函数规则
                item.rules.push(this.parseFunctionString(statement));
            }
        }
        return item;
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
            var item = input._SMRule_;
            var result = true;
            for(var i = item.rules.length - 1; i >= 0; i--) {
                var r = item.rules[i];
                if(r.rule instanceof RegExp) {
                    //正则规则
                    if(!r.rule.test(input.value)) {
                        result = r.message;
                        break;
                    }
                }else {
                    //函数规则
                    if(r.params) {
                        var params = [input.value].concat(r.params);
                        result = r.rule.apply(null, params);
                    }else {
                        result = r.rule.call(null, input.value);
                    }
                    if(result !== true) break;
                }
            }
            
            if(result === true) {
                //验证成功，去掉失败样式，隐藏失败提示
                if(item.failClass) toggleClass(input, item.failClass, true);
                if(item.failStyle) applyStyle(input, input._SMStyle_);
                if(item.failSelector){
                    toggleSelector(input, item.failSelector, true);
                }else {
                    input._failHtml_.style.display = 'none';
                }
            }else {
                //验证失败，添加失败样式，显示失败提示
                if(item.failClass) toggleClass(input, item.failClass, false);
                if(item.failStyle) applyStyle(input, item.failStyle);
                if(item.failSelector) {
                    toggleSelector(input, item.failSelector, false);
                }else {
                    input._failHtml_.innerText = result;
                    input._failHtml_.style.display = '';
                }
            }

            return result;
        }
    }

    /**全局配置 */
    var config = {
        failHtml: '<span style="color:#c33;"></span>',
        failStyle: {
            color: '#c33',
            border: '1px solid #c33'
        },
        rules: {}
    };
    /**设置全局配置 */
    SMValidator.config = function (options) {
        if(options.failStyle) config.failStyle = options.failStyle;
        if(options.failHtml) config.failHtml = options.failHtml;
        if(options.rules) {
            for(var k in options.rules) {
                config.rules[k] = parseRule(options.rules[k]);
            }
        }
    }
    /**公共validate使用的SMValidator */
    var sm = new SMValidator();
    /**
     * 手动验证表单，默认只验证manul属性为true的表单
     * @param inputs 表单数组或表单选择器
     * @param ignoreManul 忽略手动，强制验证manul为false的表单
     * @param resetRule 是否重设规则，如果动态修改了验证规则，可以传入true来更新规则
     * @return 如果全部通过则返回true，否则返回false
     */
    SMValidator.validate = function (inputs, ignoreManul, resetRule) {
        var ins = typeof inputs === 'string' ? sm.queryInput(selectors, resetRule) : inputs;
        var len = ins.length;
        var passCount = 0;
        for(var i = 0; i < len; i++) {
            var input = ins[i];
            if(input._SMRule_.manul || ignoreManul) {
                if(validate(input)) passCount++;
            }
        }
        return passCount === len;
    }

    return SMValidator;
}));