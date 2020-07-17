'use strict';

// helper
const helper = require('../helper');


/*缩写与实际意义对应关系
逆变器
    ic: inverter_code
    rh: total_run_hours
    g: total_generation
    o: total_output_power
    a: total_active_power
    r: total_reactive_power
    d: daily_power_generation
    e: efficiency
    t: temperature
    rt: reactor_temperature
    f: power_factor
    s: status // 运行状态
    w: warning  // 错误预警
    dc: dc_parameter
        c1~c8: current1~current8
        v1~v8: voltage1~voltage8
    ad: address
    uid: board uid(optional)
    // 扩展更多字段
    ccs: combiner_current 汇流板电流
        c1~c18: current1~current18
    ab: A-B 线电压, A相电压
    bc: B-C 线电压, B相电压
    ca: C-A 线电压, C相电压
    ai: A相电流
    bi: B相电流
    ci: C相电流
*/

var inverter = {
    ic: '',
    rh: '0',
    g: '0',
    o: '0',
    a: '0',
    r: '0',
    d: '0',
    e: '1',
    t: '20',
    rt: '20',
    f: '1',
    s: '',
    w: '',
    dc: {}
};


var errorJLMap = {
    0: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],  // 工作状态
    1: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],  // 故障1~5
    2: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],
    3: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],
    4: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"],
    5: ["00", "01", "02", "03", "04", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"]
};

function formatData(msg, conf, dName) {
    var addr = conf.address;
    if(dName.indexOf('jinlang') >= 0) {
        return fmtJinlangData(msg, addr);
    } else if (dName.indexOf('origin-msg') >= 0) {
        return message;
    } else {
        return {
            "dn": dName,
            "mn": moduleName,
            "ad": ad,
            "ex": "no deal function find"
        };
    }
    return false;
}

function fmtJinlangData(message, addr) {
    var ivn = helper.deepCopy(inverter);

    // basic data
    var s1 = message.sn1;
    var s2 = message.sn2;
    var s3 = message.sn3;
    var s4 = message.sn4;
    ivn.ic = s1 + '-' + s2 + '-' + s3 + '-' + s4;
    ivn.g = message.totalEnergy && parseFloat(message.totalEnergy);
    ivn.o = message.directSidePower && parseFloat(message.directSidePower);
    ivn.a = message.activePower && parseFloat(message.activePower);
    ivn.d = message.dailyEnergy && parseFloat(message.dailyEnergy);
    ivn.f = message.factor && parseFloat(message.factor);
    ivn.t = message.temp && parseFloat(message.temp);

    // direct side data
    ivn.dc.c1 = message.current1 && parseFloat(message.current1);
    ivn.dc.c2 = message.current2 && parseFloat(message.current2);
    ivn.dc.c3 = message.current3 && parseFloat(message.current3);
    ivn.dc.c4 = message.current4 && parseFloat(message.current4);
    ivn.dc.v1 = message.voltage1 && parseFloat(message.voltage1);
    ivn.dc.v2 = message.voltage2 && parseFloat(message.voltage2);
    ivn.dc.v3 = message.voltage3 && parseFloat(message.voltage3);
    ivn.dc.v4 = message.voltage4 && parseFloat(message.voltage4);

    try {
        // 总输入功率
        inv.i = ivn.dc.c1*ivn.dc.v1 + ivn.dc.c2*ivn.dc.v2 + ivn.dc.c3*ivn.dc.v3 + ivn.dc.c4*ivn.dc.v4;
        inv.i = parseFloat(inv.i.toFixed(3));
    } catch(e) {
        // 忽略这个属性
    }

    // fault info
    ivn.s = message.status;
    ivn.w = [message.status];

    // 报警信息
    var ws = [];
    ws = _getWarningInfo(errorJLMap, message, "JL");
    ivn.w = ivn.w.concat(ws);

    // address
    ivn.ad = addr;

    // 交流信息
    if(message["outType"] == 1) {   // 输出相电压
        ivn.av = message.ab && parseFloat(message.ab);
        ivn.bv = message.bc && parseFloat(message.bc);
        ivn.cv = message.ca && parseFloat(message.ca);
        ivn.ai = message.ai && parseFloat(message.ai);
        ivn.bi = message.bi && parseFloat(message.bi);
        ivn.ci = message.ci && parseFloat(message.ci);
    } else if(message["outType"] == 2) {   // 输出线电压
        ivn.ab = message.ab && parseFloat(message.ab);
        ivn.bc = message.bc && parseFloat(message.bc);
        ivn.ca = message.ca && parseFloat(message.ca);
        ivn.ai = message.ai && parseFloat(message.ai);
        ivn.bi = message.bi && parseFloat(message.bi);
        ivn.ci = message.ci && parseFloat(message.ci);
    }

    // calculation
    try {
        ivn.e = parseFloat(((message.activePower / message.directSidePower) || 1).toFixed(4));
    } catch (err) {
        console.log('In calculate efficiency, ' + err);
    }

    // 判断数据是否完整
    if(s1 && ivn.g && ivn.ad) {
        return ivn;
    } else {
        return null;
    }
}

function _getWarningInfo(map, message, prefix, statusVal) {
    prefix = typeof prefix !== "undefined" ? prefix : "";
    var ws = [];
    for(var i=0; i<=16; i++) {
        var wiStr = typeof message["w"+i] !== 'undefined' ? message["w"+i] : "";
        var re = _checkExist(map, i, wiStr, statusVal);
        if(re) {
            re.map(function(k, ind) {
                if (k > 0) {
                    ws.push(prefix + (Array(2).join('0') + i).slice(-2) + map[i][ind]);
                }
            });
        }
    }
    return ws;
}

function _checkExist(map, ind, str, statusVal) {
    if(arguments.length < 3) {
        return false;
    }
    if(typeof statusVal === "undefined") {
        statusVal = 1;
    }
    if(typeof map[ind] === "undefined") {
        return false;
    }
    return map[ind].map(function(key) {
        var tmp = statusVal << parseInt(key, 16);
        var num = parseInt(str, 16);
        return (tmp & num) > 0;
    });
}

module.exports = formatData;
