function replace(str, loaners) {
    for(var i = 0; i < loaners.length; i++) {
        str = str.replace('{'+i+'}', loaners[i]);
    }
    return str;
}

var lang = {
    number: 'only number',
    email: 'wrong email format',
    range_equal: 'value must be equal to {0}',
    range_scope: 'value must be greater than {0} and less than {1}',
    range_greater: 'value must be greater than {0}',
    range_less: 'value must be less than {0}',
    renge_no_number: 'value must be number',
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
                return lang.renge_no_number;
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