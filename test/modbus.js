'use strict';

const util = require('util');
const EventEmitter = require('events');
const NodeModbus = require('node-modbus')

const helper = require('../src/helper.js');

function ModbusTcpServer(options) {
    this.options = options;
    this.client = null;
    this._init_();
}
util.inherits(ModbusTcpServer, EventEmitter);

// 启动服务
ModbusTcpServer.prototype._init_ = function() {
    var that = this;

    this.client = NodeModbus.client.tcp.complete({
        'host': that.options.host, /* IP or name of server host */
        'port': that.options.port, /* well known Modbus port */
        'timeout': that.options.timeout, /* 2 sec */
        'unitId': that.options.addr,  // 地址号
        'autoReconnect': that.options.autoReconnect, /* reconnect on connection is lost */
        'reconnectTimeout': that.options.reconnectTimeout, /* wait 15 sec if auto reconnect fails to often */
        // 'logLabel': 'ModbusClientTCP', /* label to identify in log files */
        'logLevel': 'debug', /* for less log use: info, warn or error */
        'logEnabled': that.options.logEnabled
    });

    this.client.connect()
    this.client.on('connect', function () {
        helper.log("modbus Tcp 连接成功", that.options.host, that.options.port);
    });
};

ModbusTcpServer.prototype.readHoldingRegisters = function(start, length) {
    var that = this;
    try{
        if(this.client) {
            this.client.readHoldingRegisters(start, length).then(function (resp) {
                helper.log(resp.payload.toString("hex"));
            }).catch(function (err) {
                helper.log(err)
            }).done(function () {
                //that.emit("data", msg);
            });
        }
    } catch (e) {
        helper.log("readHoldingRegisters", e.message);
    }
};

module.exports = ModbusTcpServer;
