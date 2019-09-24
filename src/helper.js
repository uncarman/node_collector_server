
function log() {
    try {
        let logStr = "";
        if (arguments.length > 0) {
            for(let i = 0 ; i < arguments.length; i ++) {
                let logObj = arguments[i];
                logStr += " " + (typeof logObj != "string" ? JSON.stringify(logObj) : logObj);
            }
        }
        console.log((new Date()).toJSON() + " " + logStr);
    } catch (e) {
        // pass
    }
}

function debug() {
    if(isDebug) {
        log(arguments);
    }
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 合并两个object的属性
function extendObj(obj1, obj2, overWrite) {
    for(var key in obj2){
        if(obj1.hasOwnProperty(key) && !overWrite) {
            continue;
        }
        obj1[key]=obj2[key];
     }
     return obj1;
}

module.exports.log = log;
module.exports.debug = debug;
module.exports.deepCopy = deepCopy;
module.exports.extendObj = extendObj;