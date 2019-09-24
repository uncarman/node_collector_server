'use strict';

const util = require('util');
const EventEmitter = require('events');

var mysql = require('mqtt');

function DbServer(options) {
    EventEmitter.call(this);
    this.options = options;
    this.started = false;
    this.server = null;

    // 创建server实例
    this._createServer();
}
util.inherits(MqttServer, EventEmitter);


// 启动服务
DbServer.prototype._createServer = function() {
	this.server = mysql.createConnection({
		host     :  this.options.host,
		database :  this.options.database,
		user     :  this.options.user,
		password :  this.options.password,
	});
	this.server.connect();
}

// 停止服务
DbServer.prototype._stopServer = function() {
	this.server.end();
}

// 拿到相关数据
DbServer.prototype.getDatas = function() {
	
}

module.exports = DbServer;
