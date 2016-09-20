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
    //blur事件不能冒泡，所以使用change
    on.call(document, 'change', function(e){
        var input = e.target;
        if(input._sm && !input._sm.rule.manul && input._sm.rule.blur) {
            validate(input);
        }
    });

    function isString(obj) {
        return typeof obj === 'string';
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key);
    }

    var GLOBAL_ATTRIBUTES = ['required', 'server', 'blur', 'manul', 'failHtml', 'failStyle', 'failCss', 'passHtml', 'passStyle', 'passCss'];
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
                        var result = SMValidator.validate(e.target._smInputs, {locate: true});
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

        var name = input.getAttribute('name');
        var dataRule = input.getAttribute('data-rule');
        var item = dataRule ? this.parseString(dataRule) : this.fields[name];
        if(item) {
            input._sm = {rule: item, flag: 0};

            if(input.type === 'checkbox' || input.type === 'radio') {
                //对于checkbox和radio只解析一个，其他input都引用这个规则
                var inputs = document.querySelectorAll('input[name="' + name + '"]');
                for(var i = inputs.length - 1; i >= 0; i--) {
                    if(inputs[i] !== input) inputs[i]._sm = input._sm;
                }
                //checkbox和radio只有change事件有效
                item.blur = true;
            }

            //对于name相同的input，共用同一个规则，只初始化一次
            if(!item._isInit) {
                item._isInit = true;

                function handleProperty(item, prop) {
                    //required和server没指定则默认为false
                    //如果为true则赋值为显示的消息文本
                    if(!hasOwn(item, prop)) {
                        item[prop] = false;
                    }else if(item[prop] === true) {
                        item[prop] = this[prop];
                    }
                }
                handleProperty.call(this, item, 'required');
                handleProperty.call(this, item, 'server');
                //服务器验证必须是手动验证
                if(item.server) item.manul = true;

                //初始化field属性，如果没填，则使用局部或全局属性
                //required和server已经处理过，虽然在循环中，但不处理
                for(var i = GLOBAL_ATTRIBUTES.length - 1; i >= 0; i--) {
                    var attr = GLOBAL_ATTRIBUTES[i];
                    if(!hasOwn(item, attr)) item[attr] = this[attr];
                }

                function handleStyle(item, prop) {
                    if(isString(item[prop])) {
                        try{
                            item[prop] = JSON.parse(item[prop].replace(/'/g,'\"'));
                        }catch(e) {
                            console.error('error json format: ' + item[prop]);
                        }
                    }
                }
                handleStyle(item, 'failStyle');
                handleStyle(item, 'passStyle');
            }

            //当有failStyle或passStyle时记录原始样式
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

            //用于提示消息的html，如果是html文本则新建一个Dom，如果是选择器则使用这个选择器的Dom
            function handleHtml(input, prop, htmls) {
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
            handleHtml(input, 'failHtml', item.failHtml);
            handleHtml(input, 'passHtml', item.passHtml);

            //记录使用样式的对象，如果className中有+号表示应用样式的是input的父节点，一个+号往上一层
            function handleCss(input, prop, classNames) {
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
            handleCss(input, 'failCss', item.failCss);
            handleCss(input, 'passCss', item.passCss);

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
            if(!statement) continue; //防止规则中出现;;的情况
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
                    if(n === 'failStyle' || n === 'passStyle') {
                        item[n] = result.params[0];
                    }else {
                        //blur manul required server不带参数时赋true值
                        item[n] = result.params || true;
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
            if(item.rule instanceof Array) {
                item.rules = [{rule: item.rule[0], message: item.rule[1]}];
            }else if(item.rule instanceof Function) {
                item.rules = [{rule: item.rule}];
            }else if(isString(item.rule)) {
                var a = item.rule.split(';');
                item.rules = [];
                for(var i = a.length - 1; i >= 0; i--) {
                    if(a[i]) this.parseRule(this.parseStringFunction(a[i]), item);
                }
                delete item.rule;
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
            if(result && !m.quiet) m.dom.innerText = result;
        }
    }

    /**应用样式到input上 */
    function applyStyle(input, style) {
        if(!style) return;
        for(var k in style) {
            input.style[k] = style[k];
        }
    }

    /**验证input的值 */
    function validate(input, options) {
        var type = input.type;
        var name = input.name;
        var sm = input._sm;
        var item = sm.rule;
        var result = true;
        var flag = 1; //0初始状态 1通过 2失败
        var value = '';
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
                for(var i = item.rules.length - 1; i >= 0; i--) {
                    var ruleItem = item.rules[i];
                    var rule = ruleItem.rule;
                    if(rule instanceof RegExp) {
                        //正则规则
                        if(!rule.test(value)) {
                            result = ruleItem.message;
                            flag = 2;
                            break;
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
                            break;
                        }
                    }
                }
            }else if(item.required) {
                flag = 2;
                result = item.required;
            }else{
                flag = 0;
            }
        }

        //当上一次验证结果跟这一次不一样的时候才更改样式
        if(flag !== sm.flag || sm.lastResult !== result) {
            sm.lastResult = result;
            sm.flag = flag;

            applyStyle(input, sm.style);
            toggleElement(sm.failHtml, false);
            toggleElement(sm.passHtml, false);
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
                toggleElement(sm.failHtml, true, result);

                if(item.fail) item.fail.call(input);
            }else {
                toggleClass(sm.failCss, false);
                toggleClass(sm.passCss, false);
            }
        }
        //定位验证失败的字段
        if(flag === 2 && config._useLocate) {
            input.scrollIntoView();
            config._useLocate = false;
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
     * @param options.serverMessage //服务器返回来的消息，用于设置带有server属性的验证
     * @return 如果全部通过则返回true，否则返回false
     */
    SMValidator.validate = function (inputs, options) {
        var ins = isString(inputs) ? globalInstance.queryInput(inputs) : inputs;
        var passCount = 0;
        var count = 0;
        if(options && options.locate) config._useLocate = true;
        for(var i = ins.length - 1; i >= 0; i--) {
            var input = ins[i];
            if(input._sm) {
                count++;
                if(validate(input, options) === true) passCount++;
            }
        }
        return count === passCount;
    }

    SMValidator.reset = function (inputs) {
        SMValidator.validate(inputs, {forceFlag: 0});
    }

//DEFAULT-CONFIG-PLACEHOLDER

    return SMValidator;
}));