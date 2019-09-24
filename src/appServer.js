'use strict';

const util = require('util');
const EventEmitter = require('events');
const Db = require('./db.js');
const Collector = require('./collector.js');
const helper = require('./helper.js');
const httpClient = require('./httpClient.js');

function AppServer(options) {
    this.options = options;
    this.collectors = [];
    this._createServer();
}
util.inherits(AppServer, EventEmitter);

AppServer.prototype._createServer = function() {
    let that = this;

    // 创建 prod + test 环境的 http client
    this.httpClientProd = null;
    this.httpClientTest = null;
    // if(this.options.httpServerProd) {
    //     this.httpClientProd = new httpClient(this.options.httpServerProd);
    //     this.httpClientProd.on('end', function (res) {
    //         helper.log('httpClientProd post end:', res);
    //     });
    //     this.httpClientProd.on('error', function(err) {
    //         helper.log('httpClientProd on error: ', err);
    //     });
    // }
    // if(this.options.httpServerTest) {
    //     this.httpClientTest = new httpClient(this.options.httpServerTest);
    //     this.httpClientTest.on('end', function (res) {
    //         helper.log('httpClientTest post end:', res);
    //     });
    //     this.httpClientTest.on('error', function(err) {
    //         helper.log('httpClientTest on error: ', err);
    //     });
    // }

    this.db = new Db(this.options.mysql);
}

AppServer.prototype.start = function(env) {
    helper.log("启动服务", env);
    Promise.all([
        this.db.getCollectors();
        this.db.getItems();
    ]).then((data) => {
        // 缓存数据
        this._collectors = data[0];
        this._items = data[1];

        // 启动采集器采集
        this._collectors.map(function(c){
            c.items = this._items.filter(function(it){
                return it.collector_id = c.id;
            });
            var col = new Collector(c);
            this.collectors.push(col);
            col.startCollector();
        });
    });
}

module.exports = AppServer;
