'use strict';

const util = require('util');
const EventEmitter = require('events');
const Db = require('./db.js');
const helper = require('./helper.js');
const httpClient = require('./httpClient.js');

function AppServer(options) {
    this.options = options;
    this.pool = [];

    this._createServer();
}
util.inherits(AppServer, EventEmitter);

AppServer.prototype._createServer = function() {
    let that = this;
    this.redis = new Redis(this.options.redis);

    // 创建 prod + test 环境的 http client
    this.httpClientProd = null;
    this.httpClientTest = null;
    if(this.options.httpServerProd) {
        this.httpClientProd = new httpClient(this.options.httpServerProd);
        this.httpClientProd.on('end', function (res) {
            helper.log('httpClientProd post end:', res);
        });
        this.httpClientProd.on('error', function(err) {
            helper.log('httpClientProd on error: ', err);
        });
    }
    if(this.options.httpServerTest) {
        this.httpClientTest = new httpClient(this.options.httpServerTest);
        this.httpClientTest.on('end', function (res) {
            helper.log('httpClientTest post end:', res);
        });
        this.httpClientTest.on('error', function(err) {
            helper.log('httpClientTest on error: ', err);
        });
    }

    // 创建 mqtt client
    this.db = new Db(this.options.mysql);
    this.mqtt.on("data", function(msg){
        if(that.httpClientProd) {
            that.httpClientProd.write(msg);
        }
        if(that.httpClientTest) {
            that.httpClientTest.write(msg);
        }
    });

}

AppServer.prototype.start = function(env) {
    helper.log("启动服务", env);
    setTimeout(() => {
        this.mqtt.stopCollect();
        // 更新需要采集的设备信息,异步流程控制,mqtt需要先从reids获取采集队列,TODO::异常错误控制
        Promise.all([
            this.redis.updateQueue(),
            this.redis.updateMapper()
        ]).then((data) => {
            this.mqtt.startCollect(data[0], data[1]);
        });
    }, 1000);
}

module.exports = AppServer;