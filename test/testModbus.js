
const modbus = require('./modbus.js');
const config = require('../conf/test.json');


var m = new modbus({
    host: "127.0.0.1",
    port: 502,
    addr: 1,
    timeout: 2000,
    autoReconnect: true,
    reconnectTimeout: 10000,
    logEnabled: true,
});

setInterval(function () {
    m.readHoldingRegisters(0, 16);
}, 2000);

