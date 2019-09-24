'use strict';

const util = require('util');
const EventEmitter = require('events');
const helper = require('./helper.js');
var redis = require('redis');

const dlt645 = require('../test/dlt645.json');
const modbus = require('../test/modbus.json');


function RedisServer(options) {
    EventEmitter.call(this);
    this.options = options;
    this.started = false;
    this.server = null;


    this.collectorQueue = [];
    this.collectorMapper = {};

    // 创建server实例
    this._createServer();
    
    this.updateQueue();
    this.updateMapper();
}
util.inherits(RedisServer, EventEmitter);


// 启动服务
RedisServer.prototype._createServer = function() {
    let that = this;
    if(!this.server && !this.started) {
        this.server = redis.createClient(this.options.port, this.options.host, {auth_pass: this.options.userpass});

        this.server.select(this.options.db, function (err) {
            if(err){
                helper.log('redis select db error:', err);
            }
        });
        this.server.on('error', function (err) {
            helper.log('redis server error:', err);
        });
        this.server.on('ready', function (res) {
            helper.log("连接redis服务成功", this.options.host, this.options.port);
            that.started = true;
        });
    
        return true;
    }
    return false;
}

// 模拟测试数据
RedisServer.prototype.updateQueue = function() {
    // 获取所有的采集器类型
    return new Promise((resolve, reject) => {
        this.server.hkeys(this.options.hKeyName, function(err, res){
            if(err){
                reject(err);
            }
            this.collectorQueue = res;
            resolve(this.collectorQueue);
        });
    });
};

RedisServer.prototype.updateMapper = function() {
    return new Promise((resolve, reject) => {
        // 加载 php 存入 redis 中的完整采集点表数据
        this.server.hgetall(this.options.hKeyName, function(err, res){
            if(err) {
                reject(err);
            }
            this.collectorMapper = {
                "deviceMapper" : res
            };
            resolve(this.collectorMapper);
        });
    });
};

module.exports = RedisServer;