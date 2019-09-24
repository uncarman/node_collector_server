'use strict';

const util = require('util');
const EventEmitter = require('events');

const helper = require('./helper.js');
const DataParser = require("./dataParser.js");


function Collector(options) {
    EventEmitter.call(this);
    this.options = options;
    this.started = false;
    this.server = null;

    // 初始化
    this._init_();
}
util.inherits(Collector, EventEmitter);

// 启动服务
Collector.prototype._init_ = function() {
	

	// 初始化一个dataParser
    this.dataParsers[deviceId] = new DataParser(deviceId, mapContent);
    // 当拿到采集器下某个的设备完整json信息时, 上抛出信息
    this.dataParsers[deviceId].on("data", function(msg) {
        // 补充采集器sn号
        if(msg && JSON.stringify(msg) !== "{}") {
            msg.uid = deviceId;
            that.emit("data", msg);
        }
    });
    // 当拿到采集器下单个的设备采集结束
    this.dataParsers[deviceId].on("fdata", function(msg) {
        // 采集完成, 移除正在运行的设备编号
        that.runningDevices.splice(that.runningDevices.indexOf(deviceId), 1);
    });
    // 拿到需要发送的命令执行消息推送
    this.dataParsers[deviceId].on("send", function(cmd) {
        that.server.publish(that.deviceIdToTopic(deviceId), cmd);
    });
	
}
