'use strict';

const util = require('util');
const EventEmitter = require('events');

var mysql = require('mysql');

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
	var sql = "select * from a_collector order by code asc";
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
}

module.exports = DbServer;
