'use strict';

const util = require('util');
const EventEmitter = require('events');
const helper = require('./helper.js');
const DataParser = require("./dataParser.js");

var mqtt = require('mqtt');

function MqttServer(options) {
    EventEmitter.call(this);
    this.options = options;
    this.started = false;
    this.server = null;

    // 主键为采集器SN, 采集器SN -> topic -> dataPasser 一对一关系
    this.dataParsers = {};
    // 缓存采集器队列正序字符串, 用于检查是否更新了列表
    this.queueStr = "";
    // 缓存采集器队列
    this.queue = null;
    // 缓存采集器点表内容
    this.queueMapper = null;
    // 当前正在运行的deviceId
    this.runningDevices = [];

    // 创建server实例
    this._createServer();
}
util.inherits(MqttServer, EventEmitter);


// 启动服务
MqttServer.prototype._createServer = function() {
    let that = this;
    if(this.server || !this.started) {
        this.server = mqtt.connect(this.options.host, this.options);
        this.server.on('connect', function () {
            helper.log("连接mqtt服务成功", this.options.host, this.options.port);
        });

        this.server.on('message', function (topic, message) {
            let data = message.toString('hex');
            // helper.log("接收数据, 主题:", topic, " 数据:", data);
            let deviceId = that.topicToDeviceId(topic);
            let deviceList = Object.keys(that.dataParsers);
            if(deviceList.includes(deviceId)) {
                that.dataParsers[deviceId].feed(message);
            }
        });
        return true;
    }
    return false;
};

MqttServer.prototype.deviceIdToTopic = function(deviceId) {
    return this.options.prefix + "/" + deviceId + "/in";
};

MqttServer.prototype.topicToDeviceId = function(topic) {
    return topic.split('/')[1];
};

MqttServer.prototype.updateSubscribe = function(newQueue) {
    let remove = null;
    let add = newQueue;

    if(this.queueStr){
        // 正在采集的队列
        let oldQueue = this.queueStr.split(',');
        // 交集(依然在监听的队列)
        let mixd = newQueue.filter(function(v){
            return oldQueue.indexOf(v) > -1;
        });
        // 移除不需要监听的topic(旧队列与依然监听的队列作差得需移除的主题)
        remove = oldQueue.filter(function(v){
            return mixd.indexOf(v) == -1;
        });
        // 补充新监听的topic(新队列与依然监听的队列作差得需新订阅的主题)
        add = newQueue.filter(function(v){
            return mixd.indexOf(v) == -1;
        });
    }

    if(remove){
        for(let i = 0; i < remove.length; i++){
            // 取消订阅
            this.server.unsubscribe(this.options.prefix + "/" + remove[i] + "/out", function(err, res){
                if(err){
                    helper.log("取消主题订阅出错, 设备编号:", remove[i]);
                }
            });
            // 更新this.dataParsers, 清除不用的paser
            delete this.dataParsers[remove[i]];
        }
    }

    if(add){
        for(let j = 0; j < add.length; j++){
            this.server.subscribe(this.options.prefix + "/" + add[j] + "/out", function(err, res){
                if(err){
                    helper.log("主题订阅出错,设备编号:", add[j]);
                }
            });
        }
    }
};

MqttServer.prototype.updateQueue = function(newQueue) {
    // 读取需要采集的设备列表
    let newStr = newQueue.toString();
    // 如果设备数量有变化, 说明有新设备进来, 重置整个采集队列
    if (newStr != this.queueStr) {
        // 更新订阅消息
        this.updateSubscribe(newQueue);
        // 更新队列
        this.queueStr = newStr;
        this.queue = newQueue;
    } else {
        // 如果采集列表中还有未采集完的设备, 报警到服务器端, 需要优化采集服务
        if(this.queue.length > 0) {
            helper.log("!!!!!!!! warning !!!!!!!!, 服务器无法全部采集所有设备, 需要优化服务.");
            // 如果现存队列长度超过总队列长度, 忽略这次添加
            if (this.queue.length >= newQueue.length) {
                // pass
            } else {
                // 把设备列表补充到队列后面
                this.queue = this.queue.concat(newQueue);
            }
        } else {
            // 直接放入队列
            this.queue = newQueue;
        }
    }
}

MqttServer.prototype.queueAll = function(collectorQueue) {
    if(!this.queue){
        this.queue = collectorQueue;
    }
    // helper.log("[数据采集平台]:run mqtt queueAll: ", JSON.stringify(collectorQueue));
    let that = this;
    while (this.queue.length > 0) {
        // 拿到第一个并开始采集
        let deviceId = this.queue.shift();
        
        // 标记正在运行
        this.runningDevices.push(deviceId);
        helper.log("开始采集设备信息" + deviceId);
        try {
            // 尝试生成dataParser
            let mapContent = this.queueMapper["deviceMapper"][deviceId];
            if(!mapContent) {
                helper.log("采集设备无对应点表信息", deviceId, mapContent);
                continue;
            }
            if(typeof mapContent == "string") {
                try {
                    mapContent = JSON.parse(mapContent);
                } catch (e) {
                    helper.log("采集设备点表解析失败", deviceId, mapContent);
                    continue;
                }
            }

            // 执行解析绑定
            if(!this.dataParsers[deviceId]) {
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

            // 清除垃圾数据
            this.dataParsers[deviceId].clearAll();
            // 使用dataParser发送采集命令
            this.dataParsers[deviceId].startCollector();
        } catch(e) {
            helper.log("采集出错", e.message);
        }
    }
};

MqttServer.prototype.clearAll = function() {
    this.queue = [];
    this.queueMapper = {};
    this.queueSign = "";
    this.dataParsers = {};
};

MqttServer.prototype.stopAll = function(){
    let that = this;
    // 清除剩下的队列
    this.queue = [];
    // 停止正在运行的采集
    for( var i = 0; i < this.runningDevices.length; i ++ ) {
        this.dataParsers[this.runningDevices[i]].stopCollector();
    }
    this.runningDevices = [];
}

MqttServer.prototype.startCollect = function(collectorQueue, queueMapper) {
    this.updateQueue(collectorQueue);
    this.queueMapper = queueMapper;
    this.queueAll(collectorQueue);
};

MqttServer.prototype.stopCollect = function() {
    this.stopAll();
}

module.exports = MqttServer;
