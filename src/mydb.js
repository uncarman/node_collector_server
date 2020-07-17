"use strict";

const util = require("util");
const EventEmitter = require("events");
const mysql = require("mysql");

const helper = require("./helper");

function DbServer(options) {
    EventEmitter.call(this);
    this.options = options;
    this.started = false;
    this.server = null;

    // 创建server实例
    this._createServer();
}
util.inherits(DbServer, EventEmitter);

// 启动服务
DbServer.prototype._createServer = function() {
    this.server = mysql.createConnection({
        host: this.options.host,
        database: this.options.database,
        user: this.options.username,
        password: this.options.password
    });
    this.server.connect();
};

// 停止服务
DbServer.prototype._stopServer = function() {
    this.server.end();
};

// 拿到相关数据
DbServer.prototype.getCollectors = function() {
    var sql = "select * from a_collector where send_type = 0 order by code asc";
    return new Promise((resolve, reject) => {
        this.server.query(sql, function(error, results, fields) {
            if (error) {
                reject(error);
            }
            var res = results && results.length > 0 ? results : [];
            resolve(JSON.parse(JSON.stringify(res)));
        });
    });
};

// 拿到相关数据
DbServer.prototype.getItems = function(collector_id) {
    var sql = "select i.*, ir.rules from a_item i left join a_item_rule ir on i.id=ir.item_id where i.collector_id = "+collector_id+" order by i.collector_id asc, i.code asc";
    return new Promise((resolve, reject) => {
        this.server.query(sql, function(error, results, fields) {
            if (error) {
                reject(error);
            }
            var res = results && results.length > 0 ? results : [];
            resolve(JSON.parse(JSON.stringify(res)));
        });
    });
};

// 拿到相关数据
DbServer.prototype.updateData = function(msg) {
    var that = this;
    var sql = "select * from a_item_data where item_id = ?";
    var val = msg.id;
    this.server.query(sql, val, function(err, res, fields) {
        if (err) {
            helper.log(err.message);
        }
        var curItem = null;
        if (res && res.length > 0) {
            curItem = res[0];
        }
        if (curItem) {
            sql =
                "update a_item_data set indication = ?, other_data = ?, updated_at = ? where id= ?";
            val = [msg.ind, JSON.stringify(msg), new Date(), curItem.id];
        } else {
            sql =
                "insert into a_item_data (item_id, indication, other_data, updated_at) values (?,?,?,?)";
            val = [msg.id, msg.ind, JSON.stringify(msg), new Date()];
        }
        that.server.query(sql, val, function(err, res, fields) {
            if (err) {
                helper.log(err.message);
            }
            //helper.log(res);
        });
    });
};

DbServer.prototype.updateWarning = function(msg) {
    var that = this;
    var sql = "select * from a_item_warning where item_id = ? and warning_category = ? and has_fixed = 0 order by reported_at desc";
    this.server.query(sql, [msg.item_id, msg.warning_category], function(err, res, fields) {
        if (err) {
            helper.log(err.message);
        }
        var curItem = null;
        if (res && res.length > 0) {
            curItem = res[0];
        }
        helper.debug(curItem);
        // 修复预警
        var needSql = false;
        sql = "";
        var val = [];
        if (msg.has_fixed == 1) {
            if (curItem) {
                sql = "update a_item_warning set updated_at = ?, has_fixed = 1 where id= ?";
                val = [new Date(), curItem.id];
                needSql = true;
            } else {
                // 没有错误, 忽略
            }
        } else {
            if (curItem) {
                sql = "update a_item_warning set updated_at = ?, compare = ? where id= ?";
                val = [new Date(), msg.compare, curItem.id];
            } else {
                sql = "insert into a_item_warning (item_id, compare, warning_category, severity, err_msg, solution_ref, reported_at) values (?,?,?,?,?,?,?)";
                val = [msg.item_id, msg.compare, msg.warning_category, msg.severity, msg.err_msg, msg.solution_ref, new Date()];
            }
            needSql = true;
        }
        helper.debug(sql);
        helper.debug(val);
        if(needSql) {
            that.server.query(sql, val, function(err, res, fields) {
                if (err) {
                    helper.log(err.message);
                }
                //helper.log(res);
            });
        }
    });
}

module.exports = DbServer;
