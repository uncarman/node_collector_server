'use strict';

// helper
const helper = require('../helper.js');

// 支持的指令类型，可以扩充
const head = 0x68;
const tail = 0x16;
const control = 0x11;
const FunctionCode = {
    "head": 0x68,
    "tail": 0x16,
    "control": 0x11,
    "error": 0xd1,
    "headBuffer": Buffer.from([0x68]),
    "tailBuffer": Buffer.from([0x16]),
    "controlBuffer": Buffer.from([0x11])
};

function Dlt645(config) {
    this.config = config;
    this.addr = null;
}

// 创建读取的命令
Dlt645.prototype._genReadBuffer = function (address, code) {
    //basic part
    var addr = string2BCD(address, 0x06);

    //flag
    var flag = string2BCD(code, 0x04);
    var len = flag.length;
    var lenBuffer = Buffer.from([len]);
    for (var i = 0; i < len; i++){
        flag[i] = flag[i] + 0x33;
    }

    //temp frame not include checksum and tail
    var frame = Buffer.concat([FunctionCode["headBuffer"], addr, FunctionCode["headBuffer"], FunctionCode["controlBuffer"], lenBuffer, flag]);

    //checksum
    var checksum = BytesChecksum(frame);

    // 电表通信头部需要添加FE FE FE
    var dlt645Head = Buffer.from('fefefefe', 'hex');
    // generate the frame
    return Buffer.concat([dlt645Head, frame, checksum, FunctionCode["tailBuffer"]]);
};

// 根据buffer读取有用的数据(去掉数据头)
// 兼容新旧版本（返回数据包含发送命令和不包含发送命令）
Dlt645.prototype._parseResponseBuffer = function (buffer) {
    // 拿到数据头
    let startPos = 0;
    let recvStart = false;
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] === FunctionCode.head) {
            recvStart = true;
            startPos = i;
            break;
        }
    }
    if(recvStart) {
        var tempBuffer = buffer.slice(startPos);
        var len = tempBuffer.length;
        if (len >= 10) {
            var dataLen = tempBuffer[9];
            // 拿到完整的数据buffer
            //console.log(len, (dataLen + 12), tempBuffer[len - 1]);
            if (len == (dataLen + 12) && tempBuffer[len - 1] == FunctionCode.tail) {
                return tempBuffer;
            } else {
                // 可能包含发送命令，去掉第一个head，尝试重新截取
                return this._parseResponseBuffer(tempBuffer.slice(1));
            }
        }
    }
    return false;
}

// 根据当前配置生成命令
Dlt645.prototype.packCmds = function (address) {
    this.addr = address;
    let ret = [];
    for (let i in this.config.commands) {
        const options = this.config.commands[i].options;
        let genCmd = this._genReadBuffer(address, options.code);
        ret.push(genCmd);
    }
    return ret;
};

Dlt645.prototype.parsePoint = function (buf, ind) {
    let dataBuffer = this._parseResponseBuffer(buf); 
    let command = this.config.commands[ind];
    // 将Buffer通过点集映射为对象
    let parsedObj = {};
    if(dataBuffer) {
        let len = dataBuffer.length;
        let checksum = dataBuffer[len - 2];
        let remain = dataBuffer.slice(0, len - 2);
        let calculateChecksum = BytesChecksum(remain);

        helper.debug("#", len, checksum, remain, calculateChecksum);

        // 校验正确性
        if (checksum == calculateChecksum[0]) {
            var pointConf = command.points;
            var tag = dataBuffer[8];
            var dataLen = dataBuffer[9];
            var start = dataBuffer.indexOf(head);
            var payloadBuffer = dataBuffer.slice(start+10, start+10+dataLen);   
            // 返回错误, 电表命令不支持
            if (tag == FunctionCode.error) {
                helper.debug("#" + command.options.name + " code: " + command.options.code + " not support");
                parsedObj[pointConf.id] = "0.00";
            }
            else {
                //decode payload
                for (let i = 0; i < payloadBuffer.length; i++) {
                    payloadBuffer[i] = payloadBuffer[i] - 0x33;
                }
                //init this.message
                let pointOffset = pointConf[0].dotPosition;
                let payloadStr = BCD2String(payloadBuffer);
                let payloadLen = payloadStr.length; 
                //helper.log("#", pointConf, pointConf[0].id, payloadStr.substr(0, payloadLen - pointOffset), payloadStr.substr(payloadLen - pointOffset));
                parsedObj[pointConf[0].id] = (payloadStr.substr(0, payloadLen - pointOffset) | "0") + "." + payloadStr.substr(payloadLen - pointOffset);
            }
        }
    }
    return parsedObj;
};


// exammple:
// 1234567 -->  0x67 0x45 0x23 0x01 
// 12345678 -->  0x78 0x56 0x34 0x12
function string2BCD(inputs, stringLen)
{
    var i = 0;
    var len = inputs.length;

    var inputsBuffer = Buffer.from(inputs);
    var outputBuffer = Buffer.alloc(stringLen);

    for (i = 0; i < stringLen; i++) {
        var index = 2 * i;
        if (index < (len - 1)) {
            outputBuffer[i] = ((inputsBuffer[len - 2 - index] - 0x30) << 4) 
                + (inputsBuffer[len - 1 - index] - 0x30);
        }  else if (index == (len - 1)) {
            outputBuffer[i] = inputsBuffer[0] - 0x30;
        } else
            outputBuffer[i] = 0;
    }

    return outputBuffer;
}

function BCD2String(inputs) {
    var len = inputs.length;
    var outputBuffer = Buffer.alloc(len * 2);

    for (var i = 0; i < len; i++) {
        outputBuffer[2 * i] = ((inputs[len - 1 - i] >> 4) + 0x30);
        outputBuffer[2 * i + 1] = (inputs[len - 1 - i] & 0x0F) + 0x30;
    }

    return outputBuffer.toString('utf8');
}

function BytesChecksum (inputs){
    var result = Buffer.alloc(1);
    var temp = 0;
    
    for (var i = 0; i < inputs.length; i++) {
        temp = inputs[i] + temp;
    }

    result[0] = temp & 0xFF;
    return result;
}

module.exports = Dlt645;