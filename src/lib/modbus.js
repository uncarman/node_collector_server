'use strict';

// helper
const helper = require('../helper');
const crc16 = require('./_crc16');
const decUtil = require('./_decUtil');

// 暂时设定一个寄存器长度为常数：一个寄存器为16bit即2byte
const regLen = 2;

// 支持的指令类型，可以扩充
const FunctionCode = {
    readControllers: 0x01,      // 读取开关合/分闸状态
    readControllerEnables: 0x02,// 读取是否能被远程控制
    readHoldingRegisters: 0x03, // 读从机实时数据
    readInputRegisters: 0x04,   // 读从机参数
    writeControllers: 0x15,     // 批量写控制开关合/分闸 
};

function Modbus(config) {
    this.config = config;
}

Modbus.prototype._encode = function (buffer) {
    var crcValue = crc16(buffer);
    var crcBuffer = Buffer.alloc(2);
    crcBuffer.writeUInt16LE(crcValue, 0);
    return Buffer.concat([buffer, crcBuffer]);
};

// 创建读取的命令
Modbus.prototype._genReadBuffer = function (slaveAddress, functionCode, startAddress, quantity) {
    var bufferLength = 6;
    var buffer = Buffer.alloc(bufferLength);

    buffer.writeUInt8(slaveAddress, 0);
    buffer.writeUInt8(functionCode, 1);
    buffer.writeUInt16BE(startAddress, 2);
    buffer.writeUInt16BE(quantity, 4);
    let code = this._encode(buffer);
    helper.debug("buffer指令地址:", startAddress, "code:", JSON.stringify(code));
    return code;
};

// 根据buffer读取有用的数据(去掉数据头)
// 兼容新旧版本（返回数据包含发送命令和不包含发送命令）
Modbus.prototype._parseResponseBuffer = function (buffer, ind) {
    helper.debug("_parseResponseBuffer origin buffer ", buffer);
    // crc 校验
    if (buffer.length < 2) {
        return null;
    }
    // let crcValue = buffer.readUInt16LE(buffer.length - 2);
    // let bufferDecoded = buffer.slice(0, buffer.length - 2);
    // let dataContent = bufferDecoded;
    // helper.debug("_parseResponseBuffer dataContent,crc16(dataContent),crcValue ", dataContent, crc16(dataContent), crcValue);
    // if (crc16(dataContent) != crcValue) {
    //     // 数据不匹配，可能包含发送命令，去掉第一个字节，尝试重新截取
    //     return this._parseResponseBuffer(buffer.slice(1), ind);
    // }

    try {
        let dataContent = buffer;
        // 解析数据内容
        let addr = parseInt(dataContent.slice(0, 1).toString('hex'), 16);  // 采集地址
        let funcCode = parseInt(dataContent.slice(1, 2).toString('hex'), 16);  // 功能码
        let dataLen = dataContent.slice(2).length;  // 数据长度
        // 移除逆变器返回的数据头
        dataContent = dataContent.slice(3);
        let funName = this.config.commands[ind].options.cmdType;
        helper.debug("====== _parseResponseBuffer ", addr, this.config.address, funcCode, dataLen);
        if(addr == this.config.address
            && funcCode == FunctionCode[funName]
            && dataLen > 0) {
            return dataContent;
        } else {
            // 数据不匹配，可能包含发送命令，去掉第一个字节，尝试重新截取
            return this._parseResponseBuffer(buffer.slice(1), ind);
        }
    } catch (e) {
        console.trace(e);
        // 数据不匹配，可能包含发送命令，去掉第一个字节，尝试重新截取
        return this._parseResponseBuffer(buffer.slice(1), ind);
    }
}

// 根据当前配置生成命令
Modbus.prototype.packCmds = function (address) {
    let ret = [];
    for (let i in this.config.commands) {
        const options = this.config.commands[i].options;
        let genCmd = this._genReadBuffer(address, FunctionCode[options.cmdType], options.startAddress, options.regNum);
        ret.push(genCmd);
    }
    console.log(ret);
    return ret;
};

Modbus.prototype.parsePoint = function (buf, ind) {
    // 直接改成直接用modbus-serial模块的方式, buf不包含头信息
    let dataBuffer = buf; //this._parseResponseBuffer(buf, ind);
    //parsePoint dataBuffer {"type":"Buffer","data":[0,0,3,191,63,1]}
    let command = this.config.commands[ind];
    helper.debug("parsePoint dataBuffer", dataBuffer, command);
    // 将Buffer通过点集映射为对象
    let parsedObj = {};
    if(dataBuffer && dataBuffer.length > 0) {
        command.points.map(p => {
            let start = p.offset * regLen;
            let end = start + p.regNum * regLen;
            let funcList = Array(['slice', start, end]).concat(p.func);
            parsedObj[p.id] = decUtil.batch(dataBuffer, funcList);
            return p.id;
        });
    }
    helper.debug("parsePoint parsedObj", parsedObj);
    return parsedObj;
};

module.exports = Modbus;

