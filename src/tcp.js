'use strict';

const util = require('util');
const EventEmitter = require('events');
const net = require('net');

const helper = require('./helper.js');
const DataParser = require("./dataParser.js");
const CollectorConf = require("../conf/collector_config.js").collectorConfig();


function TcpServer(options) {
    this.options = options;
    this.collectorId = 1;
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
            socket.connection = connection;
            socket.sn = that.collectorId; // 只有一个采集器
            socket.dataParsers = {};

            socket.setKeepAlive(true, 300000);

            socket.on('data', function(data) {
                that.dealRes(socket, data);
            });

            socket.on('close', function() {
                // clear connectionMap info
                if (that.sockets.hasOwnProperty(connection)) {
                    helper.log('#', connection, 'disconnect, update map');
                    socket.dataParser.clearAll();
                    clearInterval(socket.running);
                    socket.running = null;
                    delete that.sockets[connection];
                }
            });

            socket.on('end', function() {
                helper.log('# on end');
            });

            socket.on('error', function(error) {
                helper.log('# on error:', error.message);
            });

            that.startCollect(socket);
        });

        var host = that.options.host;
        var port = that.options.port;
        helper.log('listening ' + host + ' port ' + port);
        this.server.listen(port, host);
        return true;
    }
    return true;
};

TcpServer.prototype.setMaps = function(maps) {
    this._maps = maps;
}

TcpServer.prototype.startCollect = function(socket) {
    this.dealRes(socket);
}

TcpServer.prototype.dealRes = function(socket, buff) {
    var conf = CollectorConf;
    var that = this;

    // 已经正常启动， 有 buffer 数据
    if(socket.dataParser && buff) {
        socket.dataParser.feed(buff);
        return;
    }

    // 如果第一次启动
    // 拿到对应的设备列表器
    var items = this._maps.items.filter(function (it) {
        return it.collector_id == that.collectorId;
    });

    // 根据 items 生成 confs
    var confs = [];
    var conf = CollectorConf[0];
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
        helper.debug("设备", socket.sn, " 采集完成。");
    });
    // 拿到需要发送的命令执行消息推送
    socket.dataParser.on("send", function(cmd) {
        console.log("----------------", cmd);
        socket.write(cmd);
    });


    // 清除垃圾数据
    socket.dataParser.clearAll();
    // 使用dataParser发送采集命令
    socket.dataParser.startCollector();

    // 启动轮训
    socket.running = setInterval(function () {
        // 清除垃圾数据
        socket.dataParser.clearAll();
        // 使用dataParser发送采集命令
        socket.dataParser.startCollector();
    }, 1 * 60 * 1000);

    socket.inited = true;
};

module.exports = TcpServer;
