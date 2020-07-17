'use strict';

const fmtDlt645 = require('./fmtDlt645');
const fmtModbus = require('./fmtModbus');

function formatData(msg, conf) {
    var module = conf["module"] || false;
    var dName = conf["dName"] || false;
    if(module && dName) {
        if(module.indexOf("dlt645") >= 0) {
            return fmtDlt645(msg);
        } else {
            return fmtModbus(msg, conf, dName);
        }
    } else {
        return {
            "msg": msg,
            "conf": conf,
            "ex": "no deal conf find"
        };
    }
}

module.exports = formatData;
