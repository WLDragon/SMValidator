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
        if(input._sm && !input._sm.rule.manul && !input._sm.rule.blur) {
            validate(input);
        }
    });
    on.call(document, 'change', function(e){
        var input = e.target;
        if(input._sm && !input._sm.rule.manul && input._sm.rule.blur) {
            validate(input);
        }
    });

    var GLOBAL_ATTRIBUTES = ['blur', 'manul', 'failHtml', 'failStyle', 'failCss', 'passHtml', 'passStyle', 'passCss'];
    function SMValidator(selectors, options) {
        if(selectors) {
            var self = this;
            if(!options) options = {};
            //初始化局部属性，如果没填，则使用全局属性
            for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
                var attr = GLOBAL_ATTRIBUTES[i];
                self[attr] = options[attr] || config[attr];
            }

            self.rules = options.rules || {};
            self.submit = options.submit;

            //解析fields字段的规则
            self.fields = {};
            for(var k in options.fields) {
                self.fields[k] = self.parseField(options.fields[k]);
            }
            
            self.inputs = self.queryInput(selectors);
        }
    }

    var _proto = SMValidator.prototype;

    /**
     * 提取选择器选择的input 
     * @selectors 选择描述符
     */
    _proto.queryInput = function(selectors) {
        var self = this;
        var inputs = [];
        var els = document.querySelectorAll(selectors);
        for (var i = els.length - 1; i >= 0; i--) {
            var el = els[i];
            if(el.tagName === 'FORM') {
                el.novalidate = 'novalidate';
                var ins = [];
                for (var j = el.length - 1; j >= 0; j--) {
                    if(self.bindInput(el[j])){
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
                if(self.bindInput(el)){
                    inputs.push(el);
                }
            }
        }
        return inputs;
    }

    /**把规则绑定到input上 */
    _proto.bindInput = function(input) {
        //如果已经绑定过规则，则不重复处理
        if(input._sm) return true;

        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input._sm = {rule: item, flag: 0};
            // input._sm.rule = item;
            if(!item._isInit) {
                item._isInit = true;
                //初始化field属性，如果没填，则使用局部属性
                for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
                    var attr = GLOBAL_ATTRIBUTES[i];
                    if(!item[attr]) item[attr] = this[attr];
                }

                function parseStyle(item, prop) {
                    if(typeof item[prop] !== 'string') return;
                    try{
                        item[prop] = JSON.parse(item[prop].replace(/'/g,'\"'));
                    }catch(e) {
                        console.error('error json format: ' + item[prop]);
                    }
                }
                parseStyle(item, 'failStyle');
                parseStyle(item, 'passStyle');
            }

            //记录原始样式
            function recordStyle(input, style) {
                if(!style) return;
                if(!input._sm.style) input._sm.style = {};
                var s = input._sm.style;
                for(var k in style) {
                    if(!s[k]) s[k] = input.style[k];
                }
            }
            recordStyle(input, item.failStyle); 
            recordStyle(input, item.passStyle); 

            function bindHtml(input, prop, html) {
                var htmlDom;
                if(html.indexOf('!') === 0) {
                    html = html.substring(1);
                    //对于failHtml不使用规则的消息，只显示html
                    input._sm._quiet = true;
                }
                if(html.indexOf('<') === 0) {
                    //html
                    var div = document.createElement('div');
                    div.innerHTML = item.failHtml;
                    htmlDom = div.childNodes[0];
                    input.parentNode.insertBefore(htmlDom, input.nextElementSibling);
                }else {
                    //选择器
                    htmlDom = document.querySelector(html);
                }
                if(htmlDom) {
                    htmlDom.style.display = 'none';
                    input._sm[prop] = htmlDom;
                }
            }
            if(item.failHtml) bindHtml(input, 'failHtml', item.failHtml);
            if(item.passHtml) bindHtml(input, 'passHtml', item.passHtml);

            return true;
        }

        return false;
    }

    /**
     * 解析表示函数或数组规则
     */
    _proto.parseRule = function(result, item) {
        var n = result.name;
        var definition = this.rules[n] || config.rules[n];
        if(definition) {
            if(definition instanceof Array) {
                //数组正则规则
                item.rules.push({rule: definition[0], message: definition[1]});
            }else {
                //函数规则
                item.rules.push({rule: definition, params: result.params});
            }
            //特殊函数名，“必填”标识
            item.required = n === 'required';
        }
    }

    _proto.parseStringFunction = function(str) {
        var result = {name: str};
        var begin = str.indexOf('(');
        if(begin > 0) {
            //带有参数
            result.name = str.substring(0, begin);
            result.params = str.substring(begin + 1, str.length - 1).split(',');
        }
        return result;
    }

    /**
     * 解析规则字符串，使用';'分割
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
                var result = this.parseStringFunction(statement);
                if(GLOBAL_ATTRIBUTES.indexOf(result.name) > -1) {
                    //关键属性
                    var n = result.name;
                    if(n === 'blur' || n === 'manul') {
                        item[n] = true;
                    }else {
                        item[n] = result.params[0];
                    }
                }else {
                    //函数或数组规则
                    this.parseRule(result, item);
                }
            }
        }
        return item;
    }

    /**
     * 解析验证规则，有四种类型
     * 1、Array [/abc/, 'message']
     * 2、Function function(val){ return /abc/.test(val) || 'message';}
     * 3、String '/abc/i/message;rule1;rule2(0,10);#failSelector;!failCss;@blur;@manul'
     * 4、Object {
     *               rule: 'rule1;rule2(0,10)'|Array|Function,
     *               failSelector: '',
     *               failHtml: '',
     *               failStyle: null, //如果设置为true则不使用任何样式
     *               failCss: '',
     *               blur: false,
     *               manul: false //是否手动验证，默认值为false
     *           }
     */
    _proto.parseField = function(item) {
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
                    if(a[i] !== '') this.parseRule(this.parseStringFunction(a[i]), item);
                }
                delete item.rule;
            }
            return item;
        }
    }

    _proto.validate = function(ignoreManul){
        return SMValidator.validate(this.inputs, ignoreManul);
    }

    /**
     * 验证通过时去掉样式，验证失败时添加样式
     */
    function toggleClass(input, cssName, isAdd) {
        if(!cssName) return;
        var cns = input.className.split(' ');
        var i = cns.indexOf(cssName);
        if(!isAdd && i > -1) {
            cns.splice(i, 1);
            input.className = cns.join(' ');
        }else if(isAdd && i === -1){
            input.className += input.className ? ' ' + cssName : cssName;
        }
    }

    /**显示或隐藏指定的消息标签 */
    function toggleElement(element, isShow) {
        if(!element) return;
        element.style.display = isShow ? '' : 'none';
    }

    /**应用样式到input上 */
    function applyStyle(input, style) {
        if(!style) return;
        for(var k in style) {
            input.style[k] = style[k];
        }
    }

    /**验证input的值 */
    function validate(input) {
        var sm = input._sm;
        var item = sm.rule;
        var result = true;
        var flag = 1; //0初始状态 1通过 2失败
        //当字段是要求必填或不为空时才进行验证
        if(item.required || input.value !== '') {
            for(var i = item.rules.length - 1; i >= 0; i--) {
                var ruleItem = item.rules[i];
                var rule = ruleItem.rule;
                if(rule instanceof RegExp) {
                    //正则规则
                    if(!rule.test(input.value)) {
                        result = ruleItem.message;
                        flag = 2;
                        break;
                    }
                }else {
                    //函数规则
                    if(ruleItem.params) {
                        result = rule.apply(null, [input.value].concat(ruleItem.params));
                    }else {
                        result = rule.call(null, input.value);
                    }
                    if(result !== true) {
                        flag = 2;
                        break;
                    }
                }
            }
        }else{
            flag = 0;
        }

        //当上一次验证结果跟这一次不一样的时候才更改样式
        if(flag !== sm.flag) {
            sm.flag = flag;
            applyStyle(input, sm.style);
            toggleElement(sm.failHtml, false);
            toggleElement(sm.passHtml, false);
            if(flag === 0) {
                toggleClass(input, item.failCss, false);
                toggleClass(input, item.passCss, false);
            }else if(flag === 1) {
                toggleClass(input, item.failCss, false);
                toggleClass(input, item.passCss, true);
                applyStyle(input, item.passStyle);
                toggleElement(sm.passHtml, true);

                if(item.pass) item.pass.call(input);
            }else {
                toggleClass(input, item.passCss, false);
                toggleClass(input, item.failCss, true);
                applyStyle(input, item.failStyle);
                toggleElement(sm.failHtml, true);
                if(sm.failHtml && !sm._quiet) sm.failHtml.innerText = result;

                if(item.fail) item.fail.call(input);
            }
        }

        return result;
    }

    /**全局配置 */
    var config = {
        rules: {
            required: function(val) {
                return val !== '' || 'this is required';
            }
        }
    };

    /**设置全局配置 */
    SMValidator.config = function (options) {
        for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
            var attr = GLOBAL_ATTRIBUTES[i];
            if(options[attr]) config[attr] = options[attr];
        }
        if(options.rules) {
            for(var k in options.rules) {
                config.rules[k] = options.rules[k];
            }
        }
    }
    /**公共validate使用的SMValidator实例 */
    var smv = new SMValidator();
    smv.rules = smv.fields = {};
    /**
     * 手动验证表单，默认只验证manul属性为true的表单
     * @param inputs{Array|String} 表单数组或表单选择器描述符
     * @param ignoreManul 忽略手动标识，强制验证包括manul为false的表单
     * @return 如果全部通过则返回true，否则返回false
     */
    SMValidator.validate = function (inputs, ignoreManul) {
        var ins = typeof inputs === 'string' ? smv.queryInput(inputs) : inputs;
        var passCount = 0;
        var count = 0;
        for(var i = ins.length - 1; i >= 0; i--) {
            var input = ins[i];
            if(input._sm) {
                count++;
                if((input._sm.rule.manul || ignoreManul) && (validate(input) === true)) {
                    passCount++;
                }
            }
        }
        return count === passCount;
    }

//DEFAULT-CONFIG-PLACEHOLDER

    return SMValidator;
}));