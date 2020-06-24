"use strict";

const util = require("util");
const EventEmitter = require("events");
const Db = require("./db.js");
const TcpServ = require("./tcp.js");
const helper = require("./helper.js");
const CollectorConf = require("../conf/collector_config.js").collectorConfig();

// ind 指 conf/collector_config.js 中第几个点表模板
function AppServer(options, ind) {
    this.ind = ind;
    this.options = options;
    this.collectors = [];
    this._createServer();
}
util.inherits(AppServer, EventEmitter);

AppServer.prototype._createServer = function() {
    this.db = new Db(this.options.mysql);
};

AppServer.prototype.start = function() {
    helper.log("启动服务", this.ind);
    var that = this;

    Promise.all([this.db.getCollectors(), this.db.getItems(CollectorConf[that.ind].collectorId)]).then(data => {
        // 创建 tcp server
        that.colServ = new TcpServ(CollectorConf[that.ind]);
        that.colServ.on("data", function(msg) {
            if (msg.hasOwnProperty("ind")) {
                helper.log("[update db]", msg);
                that.db.updateData(msg);
            } else {
                helper.log("[update db]", msg);
            }
        });
        that.colServ.on("warning", function(msg) {
            helper.log("[update db]", msg);
            that.db.updateWarning(msg);
        });
        // 更新数据
        that.colServ.setMaps({
            collectors: data[0],
            items: data[1]
        });
        helper.log("DB连接成功, 需要采集设备", data[1].length, "个");
    });
};

module.exports = AppServer;
