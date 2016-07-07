SMValidator.config({
    failHtml: '<span style="color:#c00;"></span>',
    failStyle: {
        color: '#c00',
        border: '1px solid #c00'
    },
    rules: {
        required: function(val) {
            //required在系统中有特殊功能，请不要随意覆盖
            return val !== '' || '这是必填字段';
        },
        range: function(val, a, b) {
            //数值范围
            //range(a,b) 大于a小于b
            //range(a,) 大于a
            //range(,b) 小于b
            //range(a) 等于a
            var numberRegExp = /^-?\d+$/;
            if(numberRegExp.test(val)) {
                if((a === '' || numberRegExp.test(a)) || (b === '' || numberRegExp.test(b))) {
                    if(arguments.length === 2) {
                        return val == a || '值必须等于' + a;
                    }else if(arguments.length === 3){
                        if(a && b) {
                            return (val > a && val < b) || '值必须大于 ' + a + ' 且小于 ' + b;
                        }else if(a) {
                            return (val > a) || '值必须大于 ' + a;
                        }else if(b) {
                            return (val < b) || '值必须小于 ' + b;
                        }else {
                            return '无效参数';
                        }
                    }
                }else {
                    return '无效参数';
                }
            }else {
                return '不是数字';
            }
        },
        length: function(val, a, b) {
            //判断字符串长度范围
            var n = val.length;
            if(arguments.length === 2) {
                return n == a || '长度必须等于' + a;
            }else if(arguments.length === 3){
                if(a && b) {
                    return (n > a && n < b) || '长度必须大于 ' + a + ' 且小于 ' + b;
                }else if(a) {
                    return (n > a) || '长度必须大于 ' + a;
                }else if(b) {
                    return (n < b) || '长度必须小于 ' + b;
                }else {
                    return '无效参数';
                }
            }
        }
    }
});