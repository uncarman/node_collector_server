'use strict';

/* 缩写与实际意义对应关系

电表
    ac: ammeter_code
    pa: positive_active_power
    pj: positive_jian_power
    pf: positive_feng_power
    pp: positive_ping_power
    pg: positive_gu_power
    ra: reverse_active_power
    rj: reverse_jian_power
    rf: reverse_feng_power
    rp: reverse_ping_power
    rg: reverse_gu_power
*/

var ammeter = {
    ac: '',
    pa: '',
    pj: '',
    pf: '',
    pp: '',
    pg: '',
    ra: '',
    rj: '',
    rf: '',
    rp: '',
    rg: ''
};

function formatData(message) {
    ammeter.ac = message.addr;
    ammeter.pa = message.positive_active_power;
    ammeter.pf = message.positive_feng_power;
    ammeter.pj = message.positive_jian_power;
    ammeter.pp = message.positive_ping_power;
    ammeter.pg = message.positive_gu_power;
    ammeter.ra = message.reverse_active_power;
    ammeter.rf = message.reverse_feng_power;
    ammeter.rj = message.reverse_jian_power;
    ammeter.rp = message.reverse_ping_power;
    ammeter.rg = message.reverse_gu_power;

    return ammeter;
}


module.exports = formatData;
