'use strict';

const http = require('http');
const net = require('net');
const url = require('url');
const util = require('util');
const EventEmitter = require('events');
const helper = require('./helper.js');


function HttpClient(options) {
    this.connected = false;
    this.options = {
        hostname: options.host,
        port: options.port,
        method: 'POST',
        path: '/data',
        headers: {
            'Token': options.token,
            'Connection': 'keep-alive',
            'Keep-Alive': 300
        }
    };
    this._connect();
    return this;
}
util.inherits(HttpClient, EventEmitter);


HttpClient.prototype._connect = function (data) {
    if (this.connected) return; // already connected
    helper.log("#HttpClient connecting", this.options.hostname, ":", this.options.port);
    let that = this;
    this.req = http.request(this.options, (res) => {
        var response = "";
        res.setEncoding('utf8');
        // handle data event
        res.on('data', (chunk) => {
            response += chunk;
        });
        // handle end event
        res.on('end', () => {
            helper.log('#HttpClient on end, reconnect.');
            that.connected = false;
            that.emit('end', response);
            that.req.end();
            that.timer = setTimeout(() => {
                that._connect();
            }, 0);
        });
    });
    // 连接完成
    this.req.on('socket', () => {
        helper.log("#HttpClient connected to", that.options.hostname, ":" + that.options.port);
        that.connected = true;
        // 如果有数据需要发送, 直接发送
        if(typeof data !== "undefined" && typeof data == "string" && data != "") {
          that.write(data);
        }
    });
    // 尝试重连
    this.req.on('error', (e) => {
        helper.log('#HttpClient on error, reconnect.');
        that.timer = setTimeout(() => {
            that._connect();
        }, 0);
        that.connected = false;
        that.emit('error', e);
    });
}




/**
 * 将传入消息以post形式发送至服务端
 * @param {string} message JSON格式字符串
 */
HttpClient.prototype.write = function (message) {
    message = typeof message == "string" ? message : JSON.stringify(message);
    helper.log("[to server]:", message);
    if (this.connected) {
        this.req.write(message);
    } else {
      this._connect(message);
    }
}

/**
 * 主动中断与server的连接
 */
HttpClient.prototype.end = function () {
    if (this.timer) clearTimeout(this.timer);
    this.connected = false;
    this.req.end();
}

module.exports = HttpClient;
