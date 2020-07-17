'use strict';

const bytenode = require('bytenode');
const ModbusRTU = require("modbus-serial");

const util = require('util');
const EventEmitter = require('events');
const net = require('net');

const helper = require('./helper');
const DataParser = require("./dataParser.bak");
const Db = require("./mydb");


// options 指 conf/collector_config.js 中当前(ind对应)点表的模板
function TcpClient(options) {
    this.options = options;

    this.client = net.Socket();

    this.sn = options.collectorId; // 采集器标识
    this.dataParser = null;
    this._connect_();
}
util.inherits(TcpClient, EventEmitter);

// 启动服务
TcpClient.prototype._connect_ = function() {
    let that = this;
    if(!this.connected) {
        that.connecting = true;
        // 连接 tcp server
        this.client.connect(this.options, function() {
            that.connected = true;
            that.connecting = false;
            helper.log('connected to Server', that.options.host, that.options.port);
            that.__initCollector__();
            that.startCollect();
        });

        this.client.on("data", function(data) {
            helper.debug('----- received data:', data);
            that.dealRes(data);
        });

        this.client.on('end', function() {
            that.connected = false;
            that.connecting = false;
            helper.log('connect end! retry connecting.');
            try {
                that.dataParser.clearAll();
            } catch(e) {
                // 
            }
            that._reconnect_();
        });

        this.client.on('error', function() {
            that.connected = false;
            that.connecting = false;
            helper.log('connect error! retry connecting.');
            try {
                that.dataParser.clearAll();
            } catch(e) {
                // 
            }
            that._reconnect_();
        });

        /*
        this.client = net.createServer(function (socket) {
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
        */
        return true;
    }
    return true;
};

TcpClient.prototype._reconnect_ = function() {
    var that = this;
    if(that.connected) {
        return false;
    }
    if(!that.connecting) {
        setTimeout(function() {
            that.client = null;
            that.client = net.Socket();
            that._connect_();
        }, 2000);
    } else {
        helper.log("warning connecting ...");
    }
}

TcpClient.prototype.setMaps = function(maps) {
    this._maps = maps;
}

TcpClient.prototype.startCollect = function() {
    var that = this;
    setInterval(function() {
        that.dataParser.clearAll();
        that.dataParser.startCollector();
    }, 1*60*1000);
}

TcpClient.prototype.__initCollector__ = function() {
    var that = this;
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
    that.dataParser = new DataParser(that.sn, confs);
    // 当拿到采集器下某个的设备完整json信息时, 上抛出信息
    that.dataParser.on("data", function(msg) {
        helper.debug(msg);
        // 补充采集器sn号
        if(msg && JSON.stringify(msg) !== "{}") {
            msg.uid = that.sn;
            msg.id = itemMap[msg.addr].id;
            //delete msg.addr;
            that.emit("data", msg);
            // 检查是否需要报警
            that.checkWarning(msg, itemMap[msg.addr]);
        }
    });
    // 当拿到采集器下单个的设备采集结束
    that.dataParser.on("fdata", function(msg) {
        // 采集完成, 移除正在运行的设备编号
        helper.debug("设备", that.sn, " 采集完成。");
    });
    // 拿到需要发送的命令执行消息推送
    that.dataParser.on("send", function(cmd) {
        helper.debug("dataParser send", cmd.toString("hex"));
        that.client.write(cmd);
    });


    // 清除垃圾数据
    // that.dataParser.clearAll();
    // 使用dataParser发送采集命令
    // that.dataParser.startCollector();

    // // 启动轮训
    // that.running = setInterval(function () {
    //     // 清除垃圾数据
    //     that.dataParser.clearAll();
    //     // 使用dataParser发送采集命令
    //     that.dataParser.startCollector();
    // }, 1 * 60 * 1000);

    that.inited = true;
}

TcpClient.prototype.dealRes = function(buff) {
    var that = this;

    // 已经正常启动， 有 buffer 数据
    if(that.dataParser && buff) {
        that.dataParser.feed(buff);
        return;
    }
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
TcpClient.prototype.checkWarning = function(msg, item) {
    try {
        var that = this;
        var rules = item.rules;
        var itemId = item.id;
        if(typeof rules == "string") {
            rules = JSON.parse(rules);
        }
        if(Array.isArray(rules) && rules.length > 0) {
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
        }
    } catch(e) {
        console.trace(e);
    }
}


module.exports = TcpClient;
