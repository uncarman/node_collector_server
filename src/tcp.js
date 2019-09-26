'use strict';

const util = require('util');
const EventEmitter = require('events');
const net = require('net');

const helper = require('./helper.js');
const DataParser = require("./dataParser.js");
const CollectorConf = require("../conf/collector_config.js").collectorConfig();


function TcpServer(options) {
    this.options = options;
    this.sockets = {};
    this.server = null;
    this.started = false;
    this._init_();
}
util.inherits(TcpServer, EventEmitter);

// 启动服务
TcpServer.prototype._init_ = function() {
    let that = this;
    if(this.server || !this.started) {
        this.server = net.createServer(function (socket) {
            helper.log('connect collector: ' + socket.remoteAddress + ':' + socket.remotePort);
            var connection = socket.remoteAddress + ':' + socket.remotePort;
            that.sockets[connection] = socket;
            socket.inited = false;
            socket.dataParsers = {};

            socket.setKeepAlive(true, 300000);

            socket.on('data', function(data) {
                that.dealRes(connection, data);
            });

            socket.on('close', function() {
                // clear connectionMap info
                if (that.sockets.hasOwnProperty(connection)) {
                    helper.log('#', connection, 'disconnect, update map');
                    delete that.sockets[connection];
                }
            });

            socket.on('end', function() {
                console.log('# on end');
            });

            socket.on('error', function(error) {
                console.log('# on error:', error);
            });

            // 获取采集器id
            socket.write(JSON.stringify({
                "method": "getId",
            }));
        });

        var host = that.options.host;
        var port = that.options.port;
        console.log('listening ' + host + ' port ' + port);
        this.server.listen(port, host);
        return true;
    }
    return true;
};

TcpServer.prototype.setMaps = function(maps) {
    this._maps = maps;
}

TcpServer.prototype.dealRes = function(socketId, buff) {
    helper.debug(socketId, buff.toString("hex"));
    var that = this;
    var socket = this.sockets[socketId];
    var data = {};
    try {
        data = JSON.parse(buff.toString("utf8"));
    } catch (e) {
        // buffer 数据
        try {
            if(socket.dataParser) {
                socket.dataParser.feed(buff);
            }
        } catch (e) {
            // pass
        }
    }

    // 获取sn返回
    if(data.hasOwnProperty("sn")) {
        socket.sn = data.sn;

        // 采集准备
        // 拿到对应的采集器
        var col = this._maps.collectors.filter(function (co) {
            return co.code == socket.sn;
        });
        if(col.length > 0) {
            col = col[0];
        } else {
            helper.log(socket.sn, "未读取相应的采集器");
            return null;
        }

        // 拿到对应的点表
        var conf = CollectorConf.filter(function (mc) {
            return mc.code == socket.sn;
        });
        if(conf.length > 0) {
            conf = conf[0];
        } else {
            helper.log(socket.sn, "未配置相应的采集命令");
            return null;
        }

        var items = this._maps.items.filter(function (it) {
            return it.collector_id == col.id;
        });
        // 根据 items 生成 confs
        var confs = [];
        items.map(function (it) {
            var c = JSON.parse(JSON.stringify(conf));
            c.address = it.code;
            confs.push(c);
        });
        // 生成item地址映射
        var itemMap = {};
        items.map(it=>{
            itemMap[it.code] = it;
        });

        // 初始化一个dataParser
        socket.dataParser = new DataParser(socket.sn, confs);
        // 当拿到采集器下某个的设备完整json信息时, 上抛出信息
        socket.dataParser.on("data", function(msg) {
            helper.debug(msg);
            // 补充采集器sn号
            if(msg && JSON.stringify(msg) !== "{}") {
                msg.uid = socket.sn;
                msg.id = itemMap[msg.addr].id;
                //delete msg.addr;
                that.emit("data", msg);
            }
        });
        // 当拿到采集器下单个的设备采集结束
        socket.dataParser.on("fdata", function(msg) {
            // 采集完成, 移除正在运行的设备编号
            helper.log("设备", socket.sn, " 采集完成。");
        });
        // 拿到需要发送的命令执行消息推送
        socket.dataParser.on("send", function(cmd) {
            socket.write(cmd);
        });

        // 清除垃圾数据
        socket.dataParser.clearAll();
        // 使用dataParser发送采集命令
        socket.dataParser.startCollector();

        socket.inited = true;
    }
};

module.exports = TcpServer;
