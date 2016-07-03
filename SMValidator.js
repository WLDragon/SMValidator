/*!
 * SMValidator.js
 * Copyright (c) 2016 WLDragon(cwloog@qq.com)
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.SMValidator = factory());
} (this, function () {
    'use strict';

    var document = window.document;

    //事件代理，兼容低版本IE
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

    var GLOBAL_ATTRIBUTES = ['blur', 'manul', 'html', 'style', 'css'];
    function SMValidator(selectors, options) {
        if(selectors) {
            var self = this;
            if(!options) options = {};
            //初始化局部和全局都有的属性
            for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
                var attr = GLOBAL_ATTRIBUTES[i];
                self[attr] = options[attr] || config[attr];
            }

            self.submit = options.submit;
            self.rules = options.rules || {};
            //解析fields字段的规则
            self.fields = {};
            for(var k in options.fields) {
                self.fields[k] = self.parseRule(options.fields[k]);
            }
            
            self.inputs = self.queryInput(selectors);
        }
    }

    var _proto = SMValidator.prototype;

    /**
     * 提取选择器选择的input 
     * @selectors 选择描述符
     * @resetRule 是否重新设置规则
     */
    _proto.queryInput = function(selectors, resetRule) {
        var self = this;
        var inputs = [];
        var els = document.querySelectorAll(selectors);
        for (var i = els.length - 1; i >= 0; i--) {
            var el = els[i];
            if(el.tagName === 'FORM') {
                //不使用html5的默认表单验证
                el.novalidate = 'novalidate';
                var ins = [];
                for (var j = el.length - 1; j >= 0; j--) {
                    if(self.bindInput(el[j], resetRule)){
                        ins.push(el[j]);
                    }
                }
                inputs = inputs.concat(ins);
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
                if(self.bindInput(el, resetRule)){
                    inputs.push(el);
                }
            }
        }
        return inputs;
    }

    /**把规则绑定到input上 */
    _proto.bindInput = function(input, resetRule) {
        //如果已经绑定过规则，则不重复处理，除非指明重设规则
        if(input._SMRule_ && !resetRule) return true;

        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input._SMRule_ = item;
            //只有当style明确为true时才不使用
            if(item.style !== true) {
                if(!item.style && !item._isInit) {
                    //设置验证失败后input的样式
                    item.style = this.style || config.style;
                }
                //记录原始样式，验证成功后恢复
                input._SMStyle_ = {};
                for(var k in item.style) {
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
                        for(var i = es.length - 1; i >= 0; i--) {
                            es[i].style.display = 'none';
                        }
                        //跳出函数，不执行下面创建html对象的代码
                        return true;
                    }else {
                        item.failSelector = null;
                    }
                }
                item._usehtml = true;
                if(!item.html) {
                    item.html = this.html || config.html;
                }
            }

            if(item._usehtml) {
                var div = document.createElement('div');
                div.innerHTML = item.html;
                input._html_ = div.childNodes[0];
                input.parentNode.insertBefore(input._html_, input.nextElementSibling);
            }

            return true;
        }

        return false;
    }

    /**
     * 解析表示函数的字符串
     * @param str 描述内容：funName或funName(param1,param2,...)
     */
    _proto.parseFunctionOrArray = function(str) {
        //TODO 这个函数在parseRule中也有用到，考虑怎么去掉，或者和parseString公用这个方法
        var ruleItem = {};
        var r = this.rules[str] || config.rules[str];
        if(r) {
            if(r instanceof Array) {
                //数组正则规则
                ruleItem.rule = r[0];
                ruleItem.message = r[1];
            }else {
                //函数规则
                var begin = str.indexOf('(');
                if(begin > 0) {
                    ruleItem.params = str.substring(begin + 1, str.length - 1).split(',');
                    str = str.substring(0, begin);
                }
                ruleItem.rule = r;
            }
            return ruleItem;
        }
    }

    /**
     * 解析规则字符串，使用';'分割
     * @param str 描述内容：/abc/i/message;rule1;rule2(0,10);#failSelector;!css;@blur;@manul
     * / 开头表示正则，/abc/message或/abc/i/message
     * # 开头表示失败消息显示标签的选择描述符，##myDiv或#.failDisplay或#[name="failContent"]等等
     * ! 开头表示验证失败时附加到input上的样式名，!css
     * @ 开头表示blur或manul属性，只有@blur和@manul两种值
     * 其它都表示为函数，请查看parseFunctionOrArray
     */
    _proto.parseString = function(str) {
        var item = {rules: []};
        var statements = str.split(';');
        for(var i = statements.length - 1; i >= 0; i--) {
            var statement = statements[i];
            if(statement === '') continue; //防止规则中出现;;的情况
            if(statement.indexOf('/') === 0) {
                //正则
                var a = statement.substring(1).split('/');
                if(a.length === 2) {
                    //没有修饰符i
                    item.rules.push({rule: new RegExp(a[0]), message: a[1]});
                }else if(a.length === 3) {
                    //带有修饰符i
                    item.rules.push({rule: new RegExp(a[0], 'i'), message: a[2]});
                }
            }else {
                var name = statement;
                var begin = statement.indexOf('(');
                if(begin > 0) {
                    //带有参数
                    name = statement.substring(0, begin);
                    var params = statement.substring(begin + 1, statement.length - 1).split(',');
                }
                if(GLOBAL_ATTRIBUTES.indexOf(name) > -1) {
                    //关键属性
                    if(name === 'blur' || name === 'manul') {
                        item[name] = true;
                    }else {
                        item[name] = params[0];
                    }
                }else {
                    //函数或数组规则
                    var definition = this.rules[statement] || config.rules[statement];
                    if(definition) {
                        if(definition instanceof Array) {
                            //数组正则规则
                            item.rules.push({rule: definition[0], message: definition[1]});
                        }else {
                            //函数规则
                            item.rules.push({rule: definition, params: params});
                        }
                        //特殊函数名，“必填”标识
                        item.required = statement === 'required';
                    }

                }
            }
        }
        return item;
    }

    /**
     * 解析验证规则，有四种类型
     * 1、Array [/abc/, 'message']
     * 2、Function function(val){ return /abc/.test(val) || 'message';}
     * 3、String '/abc/i/message;rule1;rule2(0,10);#failSelector;!css;@blur;@manul'
     * 4、Object {
     *               rule: 'rule1;rule2(0,10)'|Array|Function,
     *               failSelector: '',
     *               html: '',
     *               style: null, //如果设置为true则不使用任何样式
     *               css: '',
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
                    item.rules.push(this.parseFunctionOrArray(a[i]));
                }
            }
            delete item.rule;
            return item;
        }
    }

    _proto.validate = function(ignoreManul, resetRule){
        return SMValidator.validate(this.inputs, ignoreManul, resetRule);
    }

    /**
     * 验证通过时去掉样式，验证失败时添加样式
     * @param input
     * @param cssName 设置的样式名
     * @param isPass 是否验证通过
     */
    function toggleClass(input, cssName, isPass) {
        var cns = input.className.split(' ');
        var i = cns.indexOf(cssName);
        if(isPass && i > -1) {
            cns.splice(i, 1);
            input.className = cns.join(' ');
        }else if(!isPass && i === -1){
            input.className += input.className ? ' ' + cssName : cssName;
        }
    }

    /**显示或隐藏指定的消息标签 */
    function toggleSelector(input, selectors, isPass) {
        for(var i = selectors.length - 1; i >= 0; i--) {
            selectors[i].style.display = isPass ? 'none' : '';
        }
    }

    /**应用样式到input上 */
    function applyStyle(input, style) {
        for(var k in style) {
            input.style[k] = style[k];
        }
    }

    /**验证input的值 */
    function validate(input) {
        //暂时只支持text的验证
        if(input.type === 'text') {
            var item = input._SMRule_;
            var result = true;
            //当字段是要求必填或不为空时才进行验证
            if(item.required || input.value !== '') {
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
            }
            
            if(result === true) {
                //验证成功，去掉失败样式，隐藏失败提示
                if(item.css) toggleClass(input, item.css, true);
                if(item.style) applyStyle(input, input._SMStyle_);
                if(item.failSelector){
                    toggleSelector(input, item.failSelector, true);
                }else {
                    input._html_.style.display = 'none';
                }
            }else {
                //验证失败，添加失败样式，显示失败提示
                if(item.css) toggleClass(input, item.css, false);
                if(item.style) applyStyle(input, item.style);
                if(item.failSelector) {
                    toggleSelector(input, item.failSelector, false);
                }else {
                    input._html_.innerText = result;
                    input._html_.style.display = '';
                }
            }

            return result;
        }
    }

    /**全局配置 */
    var config = {
        html: '<span style="color:#c00;"></span>',
        style: {
            color: '#c00',
            border: '1px solid #c00'
        },
        rules: {
            required: function(val) {
                //字段必填
                return val !== '' || '这是必填项';
            },
            range: function(val, a, b) {
                //字符长度要求，range(5,10)大于5小于10，range(+5)大于5，range(-5)小于5
                var n = val.length;
                if(arguments.length === 2) {
                    if(a >= 0) {
                        return n > a || '长度必须大于' + a;
                    }else {
                        return n < -a || '长度必须小于' + (-a);
                    }
                }else if(arguments.length === 3){
                    return (n > a && n < b) || '长度必须大于 ' + a + ' 且小于 ' + b;
                }
            }
        }
    };
    /**设置全局配置 */
    SMValidator.config = function (options) {
        if(options.style) config.style = options.style;
        if(options.html) config.html = options.html;
        if(options.rules) {
            for(var k in options.rules) {
                config.rules[k] = parseRule(options.rules[k]);
            }
        }
    }
    /**公共validate使用的SMValidator */
    var smv = new SMValidator();
    smv.rules = smv.fields = {};
    /**
     * 手动验证表单，默认只验证manul属性为true的表单
     * @param inputs{Array|String} 表单数组或表单选择器描述符
     * @param ignoreManul 忽略手动标识，强制验证包括manul为false的表单
     * @param resetRule 是否重设规则，如果动态修改了验证规则，可以传入true来更新规则
     * @return 如果全部通过则返回true，否则返回false
     */
    SMValidator.validate = function (inputs, ignoreManul, resetRule) {
        var ins = typeof inputs === 'string' ? smv.queryInput(inputs, resetRule) : inputs;
        var len = ins.length;
        var passCount = 0;
        for(var i = 0; i < len; i++) {
            var input = ins[i];
            if(input._SMRule_.manul || ignoreManul) {
                if(validate(input) === true) passCount++;
            }
        }
        return passCount === len;
    }

    return SMValidator;
}));