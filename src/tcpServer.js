'use strict';

const bytenode = require('bytenode');

const util = require('util');
const EventEmitter = require('events');
const net = require('net');

const helper = require('./helper');
const DataParser = require("./dataParser");
const Db = require("./mydb");

// options 指 conf/collector_config.js 中当前(ind对应)点表的模板
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
            socket.connection = connection;
            socket.sn = that.options.collectorId; // 采集器标识
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
    var that = this;

    // 已经正常启动， 有 buffer 数据
    if(socket.dataParser && buff) {
        socket.dataParser.feed(buff);
        return;
    }

    // 如果第一次启动
    var items = this._maps.items;
    // 根据 items 生成 confs
    var confs = [];
    var conf = helper.deepCopy(this.options);
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
            // 检查是否需要报警
            that.checkWarning(msg, itemMap[msg.addr]);
        }
    });
    // 当拿到采集器下单个的设备采集结束
    socket.dataParser.on("fdata", function(msg) {
        // 采集完成, 移除正在运行的设备编号
        helper.debug("设备", socket.sn, " 采集完成。");
    });
    // 拿到需要发送的命令执行消息推送
    socket.dataParser.on("send", function(cmd) {
        helper.debug("send cmd", cmd);
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

// 测试报警数据
// {"pp":"55.73","uid":"5","pa":"205.85","a":"28.24","pf":"55.67","v":220,"pg":"60.21","pj":"57.34","rm":"100.00",
// "ind": "累计指标", "addr":"3","电压":"242","电流":"12"}
// [
//     {
//         "description": "电压过高",
//         "key": "电压",
//         "val": "240",
//         "compare": ">=",
//         "warning_category" : "电过压",
//         "severity": "严重",
//         "err_msg": "电压过高, 请检查",
//         "solution_ref": "切断电路",
//     },
//     {
//         "description": "电流过大",
//         "key": "电流",
//         "val": "10",
//         "compare": ">=",
//         "warning_category" : "电负载超标",
//         "severity": "严重",
//         "err_msg": "电流过高",
//         "solution_ref": "检查是否漏电, 或开启大功率设备",
//     }
// ]
TcpServer.prototype.checkWarning = function(msg, item) {
    try {
        var that = this;
        var rules = item.rules;
        var itemId = item.id;
        if(typeof rules == "string") {
            rules = JSON.parse(rules);
        }
        // 遍历rule, 检查是否需要报警
        rules.map(function(rule) {
            var key = rule.key;
            var val = rule.val;
            var compare = rule.compare;
            if(msg.hasOwnProperty(key)) {
                var compareStr = msg[key]+compare+val;
                var compareArr = JSON.stringify([msg[key],compare,val]);
                if(eval(compareStr)) {
                    // 尝试报警
                    that.emit("warning", {
                        item_id: itemId,
                        compare: compareArr,
                        warning_category: rule.warning_category,
                        severity: rule.severity,
                        err_msg: rule.err_msg,
                        solution_ref: rule.solution_ref,
                        reported_at: new Date(),
                    });
                } else {
                    // 尝试修复
                    that.emit("warning", {
                        item_id: itemId,
                        warning_category: rule.warning_category,
                        has_fixed: 1,
                        reported_at: new Date(),
                    });
                }
            }
        });
    } catch(e) {
        console.trace(e);
    }
}


module.exports = TcpServer;
