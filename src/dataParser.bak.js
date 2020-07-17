"use strict";

const bytenode = require('bytenode');
const EventEmitter = require("events");
const util = require("util");
var path = require("path");
var crypto = require("crypto");
var md5 = crypto.createHash("md5");

const helper = require("./helper");
const formatData = require("./lib/formatData");

// mqtt 协议标识
const Marked = {
    version: "v1",
    startVal: 0x53
};
const cmdTimeout = 200000;

function DataPaser(deviceId, config) {
    EventEmitter.call(this);
    this.buffer = Buffer.alloc(0);
    this.data = {};

    // 采集器 SN => CollectorCode
    this.deviceId = deviceId;
    // 采集器点表
    this.config = config;

    this.collectingFlag = false;

    this.addrs = []; // 一个采集器下的所有地址
    this.cmds = {}; // 一个采集器下的所有命令
    this.devicePasers = {}; // 一个采集器下所有用户数据解析器

    this.addrInd = 0; // 当前采集的地址序号
    this.cmdInd = -1; // 当前采集的地址中的cmd序号

    // 初始化数据
    this.init();

    // runningTimeout
    this.runCmdTimeOut = null;
    // waiting next, 是否出现延迟问题引起的数据混乱，等待下一个设备
    this.isWaitingNext = false;

    // 缓存当前信号强度
    this.signal = 0;
}
util.inherits(DataPaser, EventEmitter);

// 通过config, 初始化当前paser的所有地址命令
DataPaser.prototype.init = function() {
    this.config.forEach(conf => {
        let addr = conf.address;
        let moduleName = conf.module;
        let modulePath = "./" + path.join("lib/", moduleName);
        let DevicePaser = require(modulePath);
        this.devicePasers[addr] = new DevicePaser(conf);
        this.cmds[addr] = this.devicePasers[addr].packCmds(addr);
        // 信号线实际连接的通道地址
        this.channel = typeof conf.channel !== "undefined" ? conf.channel : 0;
        // 拿到命令的超时时间
        this.cmdTimeout =
            typeof conf.cmdTimeout !== "undefined"
                ? conf.cmdTimeout
                : cmdTimeout;
    });
    helper.debug(
        "[数据采集平台]:准备采集",
        this.deviceId,
        "cmds:",
        JSON.stringify(this.cmds)
    );
    this.addrs = Object.keys(this.cmds);
};

// 移除指定长度的buffer
DataPaser.prototype._slice = function(length) {
    let that = this;
    if (this.buffer.length >= length) {
        this.buffer = that.buffer.slice(length);
    } else {
        this.buffer = Buffer.alloc(0);
    }
};

// 接受返回的信息, 并解析
DataPaser.prototype.feed = function(data) {
    helper.debug("feed ----------------", data);
    if(this.buffer.length > 15 && data.slice(data.length-1, data.length).toString("hex") == "fe") {
        //if (!this.isWaitingNext) {
        this.buffer = Buffer.concat([this.buffer, data]);
        this.unpack();
        //} else {
            // pass 忽略收到的数据
        //}
    } else {
        this.buffer = Buffer.concat([this.buffer, data]);
        helper.debug("feed and waiting ----------------");
    }
};

///////////////// 基于通信协议 /////////////////

DataPaser.prototype.pack = function(buff) {
    // 直接上抛数据
    this.emit("send", buff);
};

DataPaser.prototype.unpack = function() {
    helper.debug("start unpack msg");
    var that = this;
    let isFinished = false;
    try {
        this.decodeData(this.buffer);
        this._slice(this.buffer.length);
        helper.debug("unpack success, do next");
        // 解析完成后, 执行下一条命令
        this.nextCmd();
    } catch (e) {
        console.trace(e);
        // 忽略当前设备后续内容，等待一个时间间隔，准备下个设备的采集
        helper.debug("unpack error:", e.message);
        helper.debug(
            "unpack error:",
            that.deviceId,
            that.addrInd,
            that.cmdInd,
            that.addrs[that.addrInd]
        );

        // 等待一次间隔后
        // 检查是否已经终止采集
        if (!this.collectingFlag) {
            this.clearAll();
        }

        // 检查是否还有设备未采集
        var nextAddrInd = this.addrInd + 1;
        if (nextAddrInd >= this.addrs.length) {
            this.clearAll();
        }

        // 执行下一个设备采集
        this.clearAll();
        this.addrInd = nextAddrInd;
        this.isWaitingNext = true;
        // 开始采集下一个设备
        clearTimeout(this.runCmdTimeOut);
        this.runCmdTimeOut = null;
        this.runCmdTimeOut = setTimeout(function() {
            helper.log("----- in timeout 0");
            that.nextCmd();
        }, that.cmdTimeout);

    }
};

// 内容buffer, 添加mqtt协议
DataPaser.prototype.pack_mqtt = function(buff) {
    /**
     下行数据
     * rank        协议
     * start       起始位,0x53
     * length      数据长度,范围2B
     * sign        签名(暂为0),范围16B
     * version     rank协议版本,0x31
     * sn          设备sn号,范围16B
     * dataType    数据类型码（下行数据）
     * timestamp   时间戳,范围4B
     * channel     频道指令,范围2B
     * keep        协议保留字段,范围10B
     * buff        用户数据(设备数据)
     */
    let start = Buffer.from("53", "hex");
    let sign = Buffer.alloc(16);
    let version = Buffer.from("31", "hex");

    let sn = Buffer.alloc(16);
    sn.write(this.deviceId);

    let dataType = Buffer.from("03", "hex");

    // 时间戳,单位秒
    let timestamp = parseInt(Date.now() / 1000);
    timestamp = Buffer.from(timestamp.toString(16), "hex");

    let channel = Buffer.from([this.channel]);

    let keep = Buffer.alloc(18);

    let len = Buffer.concat([
        sign,
        version,
        sn,
        dataType,
        timestamp,
        channel,
        keep,
        buff
    ]);

    let length = Buffer.alloc(2);
    let lens = Buffer.from(len.length.toString(16), "hex");
    let dataLeng = 2 - Buffer.from(lens).length;
    length.write(len.length.toString(16), dataLeng, "hex");

    // 拼接协议头和用户数据
    buff = Buffer.concat([start, length, len]);
    // helper.log('[数据采集平台]下发指令: '+buff.toString('hex'));
    // 上抛数据
    this.emit("send", buff);
};

// 从mqtt获取原始数据, 进行解包
DataPaser.prototype.unpack_mqtt = function() {
    var that = this;
    while (this.buffer.length > 0) {
        let isFinished = false;
        // 检查起始位, 如果没有, 直接丢弃之前的数据
        let start = this.buffer.slice(0, 1);
        if (start.toString("hex") == Marked.startVal.toString(16)) {
            try {
                // 读取数据包长度, 如果buffer>=长度, 尝试解析内容数据
                let bufferLength = this.buffer.readUInt16BE(1);
                if (this.buffer.length >= bufferLength + 3) {
                    let sign = this.buffer.slice(3, 16).toString("hex"); // 2B 帧长度（从包签名至数据末）高字节在前
                    let sn = this.buffer
                        .slice(20, 36)
                        .toString()
                        .replace(/\0/g, ""); // 16B 采集器设备 SN 号
                    let time = parseInt(
                        this.buffer.slice(37, 41).toString("hex"),
                        16
                    ); // 4B 时间戳 高字节在前
                    this.signal = parseInt(
                        this.buffer.slice(41, 42).toString("hex"),
                        16
                    ); // 信号强度 0-99 （表示 99%）
                    let dataContent = this.buffer.slice(60); // 用户数据
                    // TODO
                    // 需要做一些校验
                    if (sn == this.deviceId && dataContent.length > 0) {
                        try {
                            this._slice(bufferLength);
                            this.decodeData(dataContent);
                            // 解析完成后, 执行下一条命令
                            this.nextCmd();
                        } catch (e) {
                            // 忽略当前设备后续内容，等待一个时间间隔，准备下个设备的采集
                            //helper.log("unpack error:", e.message);
                            //helper.log("unpack error:", dataContent);
                            //helper.log("unpack error:", that.deviceId, that.addrInd, that.cmdInd, that.addrs[that.addrInd]);

                            // 等待一次间隔后
                            // 检查是否已经终止采集
                            if (!this.collectingFlag) {
                                this.clearAll();
                                break;
                            }

                            // 检查是否还有设备未采集
                            var nextAddrInd = this.addrInd + 1;
                            if (nextAddrInd >= this.addrs.length) {
                                this.clearAll();
                                break;
                            }

                            // 执行下一个设备采集
                            this.isWaitingNext = true;
                            // 开始采集下一个设备
                            clearTimeout(this.runCmdTimeOut);
                            this.runCmdTimeOut = null;
                            this.runCmdTimeOut = setTimeout(function() {
                                that.clearAll();
                                that.addrInd = nextAddrInd;
                                that.nextCmd();
                            }, that.cmdTimeout);
                        }
                    }
                } else {
                    // 等待更多数据进来
                    break;
                }
            } catch (e) {
                // 如果解析出错, 可能是第一个字节是用户数据, 造成解包失败. 尝试丢弃第一个字节, 再解包
                this._slice(1);
            }
        } else {
            // 第一个字节不是起始位, 删除并跳过
            this._slice(1);
        }
    }
};

//////////////// 基于点表配置 ////////////////
// 点表配置 -> 采集命令buffer(目前已经在初始化时完成, 直接生成号了buffer)
DataPaser.prototype.encodeData = function(data) {
    // pass
};

// 采集返回的buffer内容 -> json内容
DataPaser.prototype.decodeData = function(buffer) {
    var that = this;
    helper.debug("decodeData", buffer, this.addrInd, this.cmdInd);
    // 拿到当前地址对应的命令
    let res = this.devicePasers[this.addrs[this.addrInd]].parsePoint(
        buffer,
        this.cmdInd
    );
    // 将res的结果合并到缓存集中
    this.data = helper.extendObj(this.data, res, true);
};

// 重置dataPaser
DataPaser.prototype.clearAll = function() {
    this.isWaitingNext = false;
    this.cmdInd = -1;
    this.addrInd = 0;
    this.signal = 0;
    this.data = {
        addr: this.addrs[this.addrInd]
    };
    this.buffer = Buffer.alloc(0);

    clearTimeout(this.runCmdTimeOut);
    this.runCmdTimeOut = null;
};

// 执行下一条cmd
DataPaser.prototype.nextCmd = function() {
    // 如果已经开始执行下一个命令，肯定不需要等待超时
    this.isWaitingNext = false;

    // 清除超时
    clearTimeout(this.runCmdTimeOut);
    this.runCmdTimeOut = null;

    var that = this;

    // 检查是否已经终止采集
    if (!this.collectingFlag) {
        this.clearAll();
        return null;
    }

    this.cmdInd += 1;
    // 当前地址的采集已经结束
    // 发送缓存的数据
    helper.debug(
        "cmdInd", this.cmdInd,
        "addrInd", this.addrInd,
        "cmdInd.ind", this.cmds[this.addrs[this.addrInd]].length,
        "addrs.length", this.addrs.length
    );
    if (this.cmdInd >= this.cmds[this.addrs[this.addrInd]].length) {
        helper.debug(
            "地址",
            this.addrs[this.addrInd],
            "采集结束，",
            JSON.stringify(that.data)
        );
        // 当前地址采集完成，补充当前信号强度，发送数据
        that.emit("data", that.data);
        //that.emit("data", formatData(that.data, this.devicePasers[this.addrs[this.addrInd]]["config"]));
        // 启动下一个地址的采集
        this.addrInd += 1;
        // 清空buffer
        this.buffer = Buffer.alloc(0);
        helper.debug(
            "开始采集下一个地址",
            this.addrInd,
            this.addrs[this.addrInd]
        );
        // 采集器已全部采集结束, 重置各个flag
        if (this.addrInd >= this.addrs.length) {
            helper.debug("所有地址采集结束。");
            // 发送当前地址的所有数据
            that.emit("fdata", {});
            this.clearAll();
        } else {
            // 采集下一个地址的设备数据
            this.cmdInd = 0;
            this.data = {
                addr: this.addrs[this.addrInd]
            };
            let cmd = this.cmds[this.addrs[this.addrInd]][this.cmdInd];
            helper.debug("send cmd:", cmd);
            this.pack(cmd);

            // 启动超时监听
            this.runCmdTimeOut = setTimeout(function() {
                that.nextCmd();
            }, that.cmdTimeout);
        }
    } else {
        helper.debug(
            "继续当前地址，发送下一个命令",
            this.cmds[this.addrs[this.addrInd]][this.cmdInd]
        );
        // 通过上层mqtt发送命令
        let cmd = this.cmds[this.addrs[this.addrInd]][this.cmdInd];
        helper.debug("send cmd:", cmd);
        this.pack(cmd);

        // 启动超时监听
        this.runCmdTimeOut = setTimeout(function() {
            that.nextCmd();
        }, that.cmdTimeout);
    }
};

// 执行采集
DataPaser.prototype.startCollector = function() {
    // 轮询所有命令
    // 准备发送命令, 每次当收到回应, 才发送下一条
    // 初始化数据
    this.collectingFlag = true;
    this.cmdInd = -1;
    this.addrInd = 0;
    this.signal = 0;
    this.data = {
        addr: this.addrs[this.addrInd]
    };
    this.buffer = Buffer.alloc(0);
    // 执行第一条命令
    this.nextCmd();
};

// 停止采集
DataPaser.prototype.stopCollector = function() {
    this.collectingFlag = false;
    this.clearAll();
};

module.exports = DataPaser;
