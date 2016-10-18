(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.SMValidator = factory());
} (this, function () {
    'use strict';

    var document = window.document;

    //事件代理，兼容低版本IE
    var on = document.addEventListener ? document.addEventListener : document.attachEvent;
    //值在输入时校验
    var eventType = ('oninput' in document) ? 'input' : 'propertychange';
    on.call(document, eventType, function(e){
        var input = e.target;
        if(input._sm && !input._sm.rule.disinput && !input._sm.rule.manul) {
            validate(input);
        }
    });
    //checkbox和radio校验
    on.call(document, 'change', function(e){
        var input = e.target;
        if(input.type === 'checkbox' || input.type === 'radio') {
            if(input._sm && !input._sm.rule.manul) {
                validate(input);
            }
        }
    });

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
        'server',
        'short',
        'disinput',
        'disblur',
        'focus',
        'manul',
        'failHtml',
        'failStyle',
        'failCss',
        'passHtml',
        'passStyle',
        'passCss'
    ];
    /**input规则赋值时忽略required、server和short属性 */
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
                    on.call(el, 'submit', function(e) {
                        e.preventDefault();
                        var result = SMValidator.validate(e.target._smInputs, {
                            locate: true,
                            short: self.short
                        });
                        self.submit(result, e.target);
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
                self.handleProperty(item, 'server');
                //服务器验证必须是手动验证
                if(item.server) item.manul = true;

                //初始化field属性，如果没填，则使用局部或全局属性
                for(var i = INPUT_ATTRIBUTES.length - 1; i >= 0; i--) {
                    var attr = INPUT_ATTRIBUTES[i];
                    if(!hasOwn(item, attr)) item[attr] = this[attr];
                }

                self.handleStyle(item, 'failStyle');
                self.handleStyle(item, 'passStyle');
            }

            if(input.type === 'checkbox' || input.type === 'radio') {
                //对于checkbox和radio只解析一个，其他input都引用这个规则
                var inputs = document.querySelectorAll('input[name="' + name + '"]');
                for(var i = inputs.length - 1; i >= 0; i--) {
                    if(inputs[i] !== input) inputs[i]._sm = input._sm;
                }
                //checkbox和radio只能使用onchange触发校验
                item.disblur = item.disinput = true;
                item.focus = false;
            }

            //当有failStyle或passStyle时记录原始样式
            self.recordStyle(input, item.failStyle); 
            self.recordStyle(input, item.passStyle); 

            //用于提示消息的html，如果是html文本则新建一个Dom，如果是选择器则使用这个选择器的Dom
            self.handleHtml(input, 'failHtml', item.failHtml);
            self.handleHtml(input, 'passHtml', item.passHtml);

            //记录使用样式的对象，如果className中有+号表示应用样式的是input的父节点，一个+号往上一层
            self.handleCss(input, 'failCss', item.failCss);
            self.handleCss(input, 'passCss', item.passCss);

            if(item.focus) {
                on.call(input, 'focus', function(e){
                    clear(e.target);
                });
            }
            if(!item.disblur) {
                on.call(input, 'blur', function(e){
                    validate(e.target);
                });
            }

            return true;
        }

        return false;
    }

    _proto.handleProperty = function (item, prop) {
        //required和server没指定则默认为false
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

    _proto.handleHtml = function (input, prop, htmls) {
        if(!htmls) return;
        input._sm[prop] = [];
        if(isString(htmls)) htmls = [htmls];
        for(var i = 0; i < htmls.length; i++) {
            var htmlDom;
            var html = htmls[i];
            var htmlItem = {}; //object format:{dom:null, quiet:false}
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
                htmlDom.style.display = 'none';
                input._sm[prop].push(htmlItem);
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
            result.params = str.substring(begin + 1, str.length - 1).split(',');
        }
        return result;
    }

    /**
     * 解析规则字符串，使用'|'分割
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
                    if(n === 'failStyle' || n === 'passStyle') {
                        item[n] = result.params[0];
                    }else {
                        //manul required server等不带参数时赋Boolean值
                        item[n] = result.params || v;
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
                if(r.indexOf('&') > -1) item.token = '&';
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
            var oldCss = tar.className.split(' ');
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
            m.dom.style.display = isShow ? '' : 'none';
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
        var flag = 1; //0初始状态 1通过 2失败
        var value = '';
        var isBreak = item.token === '|';
        if((type === 'checkbox' || type === 'radio') && input.form) {
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
            if(item.server) {
                sm.serverFlag = flag;
                if(options.serverMessage) sm.serverMessage = options.serverMessage;
                if(flag === 2) {
                    result = sm.serverMessage || 'no serverMessage!';
                }
            }
        }else {
            if(item.server) {
                if(item.required && !value) {
                    flag = 2;
                    result = item.required;
                }else {
                    if(typeof sm.serverFlag === 'number') {
                        flag = sm.serverFlag;
                        if(flag === 2) {
                            result = sm.serverMessage || 'no serverMessage!';
                        }
                    }else if(value){
                        //如果有值且没有设置过serverFlag则不通过
                        flag = 2;
                        result = item.server;
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

        return result;
    }

    /**全局配置 */
    var config = {
        server: 'not been validated by server',
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
     * @param options.serverMessage //服务器返回来的消息，用于设置带有server属性的验证
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
                if(validate(input, options) === true) {
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

//DEFAULT-CONFIG-PLACEHOLDER

    return SMValidator;
}));