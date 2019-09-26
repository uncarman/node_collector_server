'use strict';

const util = require('util');
const EventEmitter = require('events');
const mysql = require('mysql');

const helper = require('./helper.js');

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
		host     :  this.options.host,
		database :  this.options.database,
		user     :  this.options.username,
		password :  this.options.password,
	});
	this.server.connect();
}

// 停止服务
DbServer.prototype._stopServer = function() {
	this.server.end();
}

// 拿到相关数据
DbServer.prototype.getCollectors = function() {
	var sql = "select * from a_collector where send_type = 0 order by code asc";
	return new Promise((resolve, reject) => {
        this.server.query(sql, function (error, results, fields) {
			if (error) {
				reject(error);
			}
			var res = results && results.length > 0 ? results : [];
			resolve(JSON.parse(JSON.stringify(res)));
		});
    });
}

// 拿到相关数据
DbServer.prototype.getItems = function() {
	var sql = "select * from a_item order by collector_id asc, code asc";
	return new Promise((resolve, reject) => {
        this.server.query(sql, function (error, results, fields) {
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
	this.server.query(sql, val, function (err, res, fields) {
		if (err) {
			helper.log(err.message);
		}
		var curItem = null;
		if(res && res.length > 0) {
			curItem = res[0];
		}
		if(curItem) {
			sql = "update a_item_data set indication = ?, other_data = ?, updated_at = ? where id= ?";
			val = [msg.ind, JSON.stringify(msg), new Date(), curItem.id];
		} else {
			sql = "insert into a_item_data (item_id, indication, other_data, updated_at) values (?,?,?,?)";
			val = [msg.id, msg.ind, JSON.stringify(msg), new Date()];
		}
		that.server.query(sql, val, function (err, res, fields) {
			if (err) {
				helper.log(err.message);
			}
			helper.log(res);
		});
	});
};

module.exports = DbServer;
