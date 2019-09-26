'use strict';

const util = require('util');
const EventEmitter = require('events');
const Db = require('./db.js');
const TcpServ = require('./tcp.js');
const helper = require('./helper.js');

function AppServer(options) {
    this.options = options;
    this.collectors = [];
    this._createServer();
}
util.inherits(AppServer, EventEmitter);

AppServer.prototype._createServer = function() {
    this.db = new Db(this.options.mysql);
}

AppServer.prototype.start = function(env) {
    helper.log("启动服务", env);
    var that = this;

    Promise.all([
        this.db.getCollectors(),
        this.db.getItems(),
    ]).then((data) => {
        // 创建 tcp server
        that.colServ = new TcpServ(this.options.colServ);
        that.colServ.on("data", function(msg) {
            if(msg.hasOwnProperty("ind")) {
                helper.log("[to server]", msg);
                //that.db.updateData(msg);
            } else {
                helper.log("[delete msg]", msg);
            }
        });

        // 更新数据
        that.colServ.setMaps({
            collectors: data[0],
            items: data[1],
        });
    });
};

module.exports = AppServer;
