/*!
 * SMValidator 1.2.7
 * Copyright (c) 2016 WLDragon(cwloog@qq.com)
 * Released under the MIT License.
 */(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.SMValidator = factory());
} (this, function () {
    'use strict';

    var document = window.document;

    var isIE8 = !document.addEventListener;

    function on(context, eventType, callback) {
        if(isIE8) {
            context.attachEvent('on' + eventType, callback);
        }else {
            context.addEventListener(eventType, callback);
        }
    }

    if(isIE8) {
        Array.prototype.indexOf = function(searchElement) {
            for(var i = 0, len = this.length; i < len; i++) {
                if(this[i] === searchElement) return i;
            }
            return -1;
        }
        // Source: https://github.com/Alhadis/Snippets/blob/master/js/polyfills/IE8-child-elements.js
        Object.defineProperty(Element.prototype, "nextElementSibling", {
            get: function(){
                var e = this.nextSibling;
                while(e && 1 !== e.nodeType)
                    e = e.nextSibling;
                return e;
            }
        });
    }else {
        //标记输入法是否完成，完成之前不验证表单
        var isCompositionend = true;
        document.addEventListener('compositionstart', function(e){
            isCompositionend = false;
        });
        document.addEventListener('compositionend', function(e){
            isCompositionend = true;
            var inputEvent = document.createEvent('HTMLEvents');
            inputEvent.initEvent('input', true, true);
            e.target.dispatchEvent(inputEvent);
        });
        //值改变时验证表单
        document.addEventListener('input', function(e) {
            if(isCompositionend) {
                var input = e.target;
                if(input._sm && !input._sm.rule.disinput) validate(input);
            }
        });
    }

    //checkbox和radio校验
    on(document, 'change', function(e){
        var input = e.target;
        if(isCheckBoxOrRadio(input.type)) {
            if(input._sm && !input._sm.rule.manul) {
                validate(input);
            }
        }
    });

    function isCheckBoxOrRadio(type) {
        return type === 'checkbox' || type === 'radio';
    }

    function isString(obj) {
        return typeof obj === 'string';
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key);
    }

    /**全局属性 */
    var GLOBAL_ATTRIBUTES = [
        'required',
        'async',
        'short',
        'disinput',
        'disblur',
        'focus',
        'manul',
        'failHtml',
        'passHtml',
        'failStyle',
        'failCss',
        'passStyle',
        'passCss'
    ];
    /**input规则赋值时忽略required、async和short属性 */
    var INPUT_ATTRIBUTES = GLOBAL_ATTRIBUTES.slice(3);
    
    function SMValidator(selectors, options) {
        var self = this;
        if(!options) options = {};
        //初始化局部属性，如果没填，则使用全局属性
        for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
            var attr = GLOBAL_ATTRIBUTES[i];
            self[attr] = hasOwn(options, attr) ? options[attr] : config[attr];
        }
        
        self.fields = {};
        self.rules = options.rules || {};
        if(selectors) {
            self.submit = options.submit;

            //解析fields字段的规则
            for(var k in options.fields) {
                self.fields[k] = self.parseField(options.fields[k]);
            }
            //查询并把规则绑定到input上
            self.queryInput(selectors);
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
            var tagName = el.tagName;
            if(tagName === 'FORM') {
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
                    el._smInputs = ins;
                    on(el, 'submit', function(e) {
                        e.preventDefault();
                        var target = e.target || e.srcElement;
                        var result = SMValidator.validate(target._smInputs, {
                            locate: true,
                            short: self.short
                        });
                        self.submit(result, target);
                    });
                }
            }else if(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
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

        var self = this;
        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input._sm = {rule: item, flag: 0};

            //对于name相同的input，共用同一个规则，只初始化一次
            if(!item._isInit) {
                item._isInit = true;

                self.handleProperty(item, 'required');
                self.handleProperty(item, 'async');
                //服务器验证必须是手动验证
                if(item.async) item.manul = true;

                //初始化field属性，如果没填，则使用局部或全局属性
                for(var i = INPUT_ATTRIBUTES.length - 1; i >= 0; i--) {
                    var attr = INPUT_ATTRIBUTES[i];
                    if(!hasOwn(item, attr)) item[attr] = this[attr];
                }

                self.handleStyle(item, 'failStyle');
                self.handleStyle(item, 'passStyle');
            }

            //当有failStyle或passStyle时记录原始样式
            self.recordStyle(input, item.failStyle);
            self.recordStyle(input, item.passStyle);

            var _sm = input._sm;
            if(isCheckBoxOrRadio(input.type)) {
                //对于checkbox和radio只解析一个，其他input都引用这个规则
                var inputs = document.querySelectorAll('input[name="' + name + '"]');
                for(var i = inputs.length - 1; i >= 0; i--) {
                    if(inputs[i] !== input) inputs[i]._sm = _sm;
                }
                //checkbox和radio只能使用onchange触发校验
                item.disblur = item.disinput = true;
                item.focus = false;
            }else if(!input.style.borderImage){
                //防止IE自动添加borderImage
                if(!_sm.style) {
                    _sm.style = {};
                }
                _sm.style.borderImage = '';
            }

            //用于提示消息的html，如果是html文本则新建一个Dom，如果是选择器则使用这个选择器的Dom
            self.handleHtml(input, 'failHtml', item);
            self.handleHtml(input, 'passHtml', item);

            //记录使用样式的对象，如果className中有+号表示应用样式的是input的父节点，一个+号往上一层
            self.handleCss(input, 'failCss', item.failCss);
            self.handleCss(input, 'passCss', item.passCss);

            //设置手动后blur和input均失效
            if(item.manul) item.disblur = item.disinput = true;
            
            if(item.focus) {
                on(input, 'focus', function(e){
                    clear(e.target || e.srcElement);
                });
            }
            if(!item.disblur) {
                on(input, 'blur', function(e){
                    validate(e.target || e.srcElement);
                });
            }
            //注：非IE8浏览器使用document代理input事件
            if(isIE8 && !item.disinput) {
                input.attachEvent('onpropertychange', function(e){
                    if(e.propertyName === 'value') validate(e.srcElement);
                });
            }

            return true;
        }

        return false;
    }

    _proto.handleProperty = function (item, prop) {
        //required和async没指定则默认为false
        //如果为true则赋值为显示的消息文本
        if(!hasOwn(item, prop)) {
            item[prop] = false;
        }else if(item[prop] === true) {
            item[prop] = this[prop];
        }
    }

    _proto.handleStyle = function (item, prop) {
        if(isString(item[prop])) {
            try{
                item[prop] = JSON.parse(item[prop].replace(/'/g,'\"'));
            }catch(e) {
                console.error('error json format: ' + item[prop]);
            }
        }
    }

    _proto.recordStyle = function (input, style) {
        if(!style) return;
        if(!input._sm.style) input._sm.style = {};
        var s = input._sm.style;
        for(var k in style) {
            if(!s[k]) s[k] = input.style[k];
        }
    }

    _proto.handleHtml = function (input, prop, item) {
        var htmls = item[prop];
        if(!htmls) return;

        input._sm[prop] = [];
        if(isString(htmls)) htmls = [htmls];
        for(var i = 0; i < htmls.length; i++) {
            var htmlDom;
            var html = htmls[i];
            var htmlItem = {}; //object format:{dom:null, quiet:false, keep:false}
            if(html.indexOf('*') === 0) {
                html = html.substring(1);
                //failHtml不使用display:'none'来隐藏，而是设置innerHTML=''
                htmlItem.keep = true;
            }
            if(html.indexOf('!') === 0) {
                html = html.substring(1);
                //failHtml不使用规则的消息，只显示html
                htmlItem.quiet = true;
            }
            if(html.indexOf('<') > -1) {
                //Dom
                //去掉“+”号
                var tar = input;
                while(html.indexOf('+') === 0) {
                    html = html.substring(1);
                    tar = tar.parentNode;
                }
                //使用html字符串生成Dom
                var div = document.createElement('div');
                div.innerHTML = html;
                htmlDom = div.children[0];
                //把Dom插到相应位置
                tar.parentNode.insertBefore(htmlDom, tar.nextElementSibling);
            }else {
                //选择器
                htmlDom = document.querySelector(html);
            }
            if(htmlDom) {
                htmlItem.dom = htmlDom;
                input._sm[prop].push(htmlItem);
                if(!htmlItem.keep) htmlDom.style.display = 'none';
            }
        }
    }

    _proto.handleCss = function (input, prop, classNames) {
        if(!classNames) return;
        if(isString(classNames)) classNames = [classNames];
        input._sm[prop] = [];
        for(var i = classNames.length - 1; i >= 0; i--) {
            var cn = classNames[i];
            //object format:[{target: element, className: ''},...]
            var tar = input;
            while(cn.indexOf('+') === 0) {
                cn = cn.substring(1);
                tar = tar.parentNode;
            }
            input._sm[prop].push({target: tar, className: cn});
        }
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
        }
    }

    _proto.parseStringFunction = function(str) {
        var result = {name: str};
        var begin = str.indexOf('(');
        if(begin > 0) {
            //带有参数
            result.name = str.substring(0, begin);
            if(str.indexOf('{') > -1) {
                //failStyle和passStyle只能有一个json格式的参数
                result.params = str.substring(begin + 1, str.length - 1);
            }else {
                result.params = str.substring(begin + 1, str.length - 1).split(',');
            }
        }
        return result;
    }

    /**
     * 解析规则字符串，使用'|'或'&'分割
     */
    _proto.parseString = function(str) {
        var item = {rules: []};
        var token = str.indexOf('&') > -1 ? '&' : '|';
        var statements = str.split(token);
        item.token = token;
        for(var i = statements.length - 1; i >= 0; i--) {
            var statement = statements[i];
            if(!statement) continue; //防止规则中出现||的情况
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
                var n = result.name;
                var v = true;
                if(n.charAt(0) === '!') {
                    n = n.substring(1);
                    v = false;
                }
                if(GLOBAL_ATTRIBUTES.indexOf(n) > -1) {
                    //关键属性
                    var params = result.params;
                    if(params) {
                        item[n] = params;
                    }else {
                        item[n] = v;
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
     * 解析验证规则，有Array|Function|String|Object四种类型
     */
    _proto.parseField = function(item) {
        if(item instanceof Array) {
            return {rules: [{rule: item[0], message: item[1]}]};
        }else if(item instanceof Function) {
            return {rules: [{rule: item}]};
        }else if(isString(item)) {
            return this.parseString(item);
        }else if(typeof item === 'object') {
            item.token = '|'; //初始化item.token，防止没有rule为string时没有token的情况
            if(item.rule instanceof Array) {
                item.rules = [{rule: item.rule[0], message: item.rule[1]}];
            }else if(item.rule instanceof Function) {
                item.rules = [{rule: item.rule}];
            }else if(isString(item.rule)) {
                var r = item.rule;
                delete item.rule;
                if(r.indexOf('&') > -1) {
                    item.token = '&';
                }
                var a = r.split(item.token);
                item.rules = [];
                for(var i = a.length - 1; i >= 0; i--) {
                    if(a[i]) this.parseRule(this.parseStringFunction(a[i]), item);
                }
            }
            return item;
        }
    }

    /**
     * 验证通过时去掉样式，验证失败时添加样式
     */
    function toggleClass(items, isAdd) {
        if(!items) return;
        for(var i = items.length - 1; i >= 0; i--) {
            var m = items[i];
            var tar = m.target;
            //使用数组而不是字符串的方式来处理可以避免字符串查询不完整的情况
            var newCss = m.className.split(' ');
            var oldCss = tar.className ? tar.className.split(' ') : [];
            for(var k = newCss.length - 1; k >=0; k--) {
                var c = newCss[k];
                var j = oldCss.indexOf(c);
                if(!isAdd && j > -1) {
                    oldCss.splice(j, 1);
                }else if(isAdd && j === -1){
                    oldCss.push(c);
                }
            }
            tar.className = oldCss.join(' ');
        }
    }

    /**显示或隐藏指定的消息标签 */
    function toggleElement(items, isShow, result) {
        if(!items) return;
        for(var i = items.length - 1; i >= 0; i--) {
            var m = items[i];
            if(m.keep) {
                if(!isShow && !m.quiet) m.dom.innerHTML = '';
            }else {
                m.dom.style.display = isShow ? '' : 'none';
            }

            if(result && !m.quiet) m.dom.innerHTML = result;
        }
    }

    /**应用样式到input上 */
    function applyStyle(input, style) {
        if(!style) return;
        for(var k in style) {
            input.style[k] = style[k];
        }
    }

    function clear(input) {
        var sm = input._sm;
        applyStyle(input, sm.style);
        toggleElement(sm.failHtml, false);
        toggleElement(sm.passHtml, false);
        toggleClass(sm.failCss, false);
        toggleClass(sm.passCss, false);
    }

    /**验证input的值 */
    function validate(input, options) {
        var type = input.type;
        var name = input.name;
        var sm = input._sm;
        var item = sm.rule;
        var result = true;
        var results = [];
        /**0初始状态 1通过 2失败 */
        var flag = 1;
        var value = '';
        var isBreak = item.token === '|';
        if(isCheckBoxOrRadio(type) && input.form) {
            //对于checkbox|radio|select-multiple，value为其选择项的数量
            var els = input.form.elements[name];
            for(var i = els.length - 1; i >= 0; i--) {
                if(els[i].checked) value += ' ';
            }
        }else if(type === 'select-multiple'){
            var els = input.children;
            for(var i = els.length - 1; i >= 0; i--) {
                if(els[i].selected && els[i].value) value += ' ';
            }
        }else {
            value = input.value;
        }

        if(options && (typeof options.forceFlag === 'number')) {
            //强制设置验证结果
            flag = options.forceFlag;
            //服务端验证，通过forceFlag设置的结果
            if(item.async) {
                sm.asyncFlag = flag;
                if(options.asyncMessage) sm.asyncMessage = options.asyncMessage;
                if(flag === 2) {
                    result = sm.asyncMessage || 'no asyncMessage!';
                }
            }
        }else {
            if(item.async) {
                if(item.required && !value) {
                    flag = 2;
                    result = item.required;
                }else {
                    if(typeof sm.asyncFlag === 'number') {
                        flag = sm.asyncFlag;
                        if(flag === 2) {
                            result = sm.asyncMessage || 'no asyncMessage!';
                        }
                    }else if(value){
                        //如果有值且没有设置过asyncFlag则不通过
                        flag = 2;
                        result = item.async;
                    }else {
                        flag = 0;
                    }
                }
            }else if(value) {
                //验证各项规则
                for(var i = item.rules.length - 1; i >= 0; i--) {
                    var ruleItem = item.rules[i];
                    var rule = ruleItem.rule;
                    if(rule instanceof RegExp) {
                        //正则规则
                        if(!rule.test(value)) {
                            result = ruleItem.message;
                            flag = 2;
                            if(isBreak) {
                                break;
                            }else {
                                results.push(result);
                            }
                        }
                    }else {
                        //函数规则
                        if(ruleItem.params) {
                            result = rule.apply(null, [value].concat(ruleItem.params));
                        }else {
                            result = rule.call(null, value);
                        }
                        if(result !== true) {
                            flag = 2;
                            if(isBreak) {
                                break;
                            }else {
                                results.push(result);
                            }
                        }
                    }
                }
            }else if(item.required) {
                flag = 2;
                result = item.required;
                if(!isBreak) results.push(result);
            }else{
                flag = 0;
            }
        }

        if(!isBreak) {
            //2 分割符为&的时候，至少一个规则验证失败
            //1 全部规则验证通过
            flag = results.length ? 2 : 1;
        }

        clear(input);
        if(flag === 1) {
            toggleClass(sm.failCss, false);
            toggleClass(sm.passCss, true);
            applyStyle(input, item.passStyle);
            toggleElement(sm.passHtml, true);

            if(item.pass) item.pass.call(input);
        }else if(flag === 2){
            toggleClass(sm.passCss, false);
            toggleClass(sm.failCss, true);
            applyStyle(input, item.failStyle);
            toggleElement(sm.failHtml, true, isBreak ? result : results.join('<br/>'));

            if(item.fail) item.fail.call(input, isBreak ? result : results);
        }
        //定位验证失败的字段
        if(flag === 2 && isLocate) {
            input.scrollIntoView();
            isLocate = false;
        }

        return flag !== 2;
    }

    /**全局配置 */
    var config = {
        async: 'not been validated by async',
        required: 'this is required',
        rules: {}
    };

    /**公共validate使用的SMValidator实例 */
    var globalInstance;
    /** 是否使用了定位错误表单位置 */
    var isLocate;
    /**设置全局配置 */
    SMValidator.config = function (options) {
        for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
            var attr = GLOBAL_ATTRIBUTES[i];
            if(hasOwn(options, attr)) config[attr] = options[attr];
        }
        if(options.rules) {
            for(var k in options.rules) {
                config.rules[k] = options.rules[k];
            }
        }

        globalInstance = new SMValidator();
    }
    /**
     * 手动验证表单
     * @param inputs{Array|String} 表单数组或表单选择器描述符
     * @param options {Object}
     * @param options.forceFlag //强行设置验证结果，0没验证 1通过 2失败
     * @param options.locate //是否定位到第一个验证失败的表单
     * @param options.short //是否遇到验证失败的表单后就跳出
     * @param options.asyncMessage //服务器返回来的消息，用于设置带有async属性的验证
     * @return 如果全部通过则返回true，否则返回false
     */
    SMValidator.validate = function (inputs, options) {
        var ins = isString(inputs) ? globalInstance.queryInput(inputs) : inputs;
        var passCount = 0;
        var count = 0;
        var short = false;
        if(options) {
            isLocate = options.locate;
            short = options.short;
        }
        for(var i = ins.length - 1; i >= 0; i--) {
            var input = ins[i];
            if(input._sm) {
                count++;
                if(validate(input, options)) {
                    passCount++;
                }else if(short) {
                    return false;
                }
            }
        }
        return count === passCount;
    }

    SMValidator.reset = function (inputs) {
        var ins = isString(inputs) ? globalInstance.queryInput(inputs) : inputs;
        for(var i = ins.length - 1; i >= 0; i--) {
            clear(ins[i]);
        }
    }

function replace(str, loaners) {
    for(var i = 0; i < loaners.length; i++) {
        str = str.replace('{'+i+'}', loaners[i]);
    }
    return str;
}

var lang = {
    number: 'only number',
    names: 'wrong name format',
    email: 'wrong email format',
    range_equal: 'value must be equal to {0}',
    range_scope: 'value must be greater than {0} and less than {1}',
    range_greater: 'value must be greater than {0}',
    range_less: 'value must be less than {0}',
    range_no_number: 'value must be number',
    error_param: 'error param',
    length_equal: 'length must be equal to {0}',
    length_scope: 'length must be greater than {0} and less than {1}',
    length_greater: 'length must be greater than {0}',
    length_less: 'length must be less than {0}',
    password: 'passwords don\'t match'
}

SMValidator.config({
    failHtml: '<span style="color:#c00;"></span>',
    failStyle: {
        color: '#c00',
        border: '1px solid #c00'
    },
    rules: {
        number: function(val) {
            //正负数整数或小数
            return /^-?\d+(\.{1}\d+)?$/.test(val) || lang.number;
        },
        names: function(val){
            // validate names
            return /^(\w+[\-']?\w+\s?)+$/i.test(val) || lang.names;
        },
        email: function(val) {
            //邮箱格式
            return /^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i.test(val) || lang.email;
        },
        range: function(val, a, b) {
            val = val * 1;
            //数值范围
            //range(a,b) 大于a小于b
            //range(a,) 大于a
            //range(,b) 小于b
            //range(a) 等于a
            var numberRegExp = /^-?\d+(\.{1}\d+)?$/;
            if(numberRegExp.test(val)) {
                if((!a || numberRegExp.test(a)) || (!b || numberRegExp.test(b))) {
                    if(arguments.length === 2) {
                        return val == a || replace(lang.range_equal, [a]);
                    }else if(arguments.length === 3) {
                        if(a && b) {
                            return (val > a && val < b) || replace(lang.range_scope, [a,b]);
                        }else if(a) {
                            return (val > a) || replace(lang.range_greater, [a]);
                        }else if(b) {
                            return (val < b) || replace(lang.range_less, [b]);
                        }else {
                            return lang.error_param;
                        }
                    }
                }else {
                    return lang.error_param;
                }
            }else {
                return lang.range_no_number;
            }
        },
        length: function(val, a, b) {
            //判断字符串长度范围，格式与range一致
            var n = val.length;
            if(arguments.length === 2) {
                return n == a || replace(lang.length_equal, [a]);
            }else if(arguments.length === 3){
                if(a && b) {
                    return (n > a && n < b) || replace(lang.length_scope, [a,b]);
                }else if(a) {
                    return (n > a) || replace(lang.length_greater, [a]);
                }else if(b) {
                    return (n < b) || replace(lang.length_less, [b]);
                }else {
                    return lang.error_param;
                }
            }
        },
        equal: function(val, targetSelector) {
            var target = document.querySelector(targetSelector);
            return val === target.value || lang.password;
        }
    }
});

/**
 * 设置语言包
 */
SMValidator.setLang = function(options) {
    for(var k in options) {
        lang[k] = options[k];
    }
}

var skins = {
    bootstrap: {
        failStyle: false, //覆盖默认样式的值
        failHtml: ['!<span class="glyphicon glyphicon-remove form-control-feedback"></span>', '<small class="help-block"></small>'],
        failCss: '++has-error has-feedback',
        passHtml: '<span class="glyphicon glyphicon-ok form-control-feedback"></span>',
        passCss: '++has-success has-feedback'
    },
    semantic: {
        failStyle: false,
        failHtml: ['!<i class="remove icon"></i>', '+<small class="ui red pointing label"></small>'],
        failCss: '++error',
        passHtml: '<i class="checkmark icon"></i>'
    }
}

/**
 * 设置表单外观
 * @param {String} skin 以下值可填"bootstrap"
 */
SMValidator.setSkin = function(skin) {
    SMValidator.config(skins[skin]);
}


    return SMValidator;
}));