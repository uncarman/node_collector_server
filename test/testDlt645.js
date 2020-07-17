
/*
测试安装设备后所有地址是否线路通信正常
运行方式：
	1. 修改addr地址范围
	2. 修改当前网关为正确的sn
	3. 运行命令 node test_communicat.js
*/

isDebug = process.argv[2] == "debug" ? true : false;

// var mqtt = require('mqtt');
// const conf = require('../conf/prod.json');
const DataParser = require("../src/dataParser.js");
const dlt645 = require("../src/lib/dlt645.js");

var parser, server;

// 设备sn


function BytesChecksum (inputs){
    var result = Buffer.alloc(1);
    var temp = 0;
    
    for (var i = 0; i < inputs.length; i++) {
        temp = inputs[i] + temp;
    }

    result[0] = temp & 0xFF;
    return result;
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
function readCmd() {
    //temp frame not include checksum and tail
    var frame = Buffer.from([0x68, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0x68, 0x13, 0x00]);
    //checksum
    var checksum = BytesChecksum(frame);
    // 电表通信头部需要添加FE FE FE
    var dlt645Head = Buffer.from('fefefefe', 'hex');
    // generate the frame
    var bf = Buffer.concat([dlt645Head, frame, checksum, Buffer.from([0x16])]);
    var dp = new DataParser(sn, []);
    return dp.pack(bf);

}
function getSn(buf) {
    var dp = new DataParser(sn, []);
    dp.decodeData = function(b) {
        var payloadBuffer = b.slice(5, 11);
        console.log("电表SN:", BCD2String(payloadBuffer));
        return BCD2String(payloadBuffer);
    };
    dp.buffer = buf;
    console.log(dp.unpack());
}

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
function _parseResponseBuffer(buffer) {
    // 拿到数据头
    let startPos = 0;
    let endPos = buffer.length - 1;
    let recvStart = false;
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] === FunctionCode.head) {
            recvStart = true;
            startPos = i;
            break;
        }
    }
    // 找到尾部 fe
    for (var i = buffer.length; i > 0; i--) {
        if (buffer[i] === 0xfe) {
            endPos = i;
            break;
        }
    }

    console.log("_parseResponseBuffer", recvStart, startPos, endPos);
    if(recvStart) {
        var tempBuffer = buffer.slice(startPos, endPos);
        var len = tempBuffer.length;
        console.log(tempBuffer, len);
        if (len >= 10) {
            var dataLen = tempBuffer[9];
            // 拿到完整的数据buffer
            console.log("拿到完整的数据buffer", len, dataLen, (dataLen + 12), tempBuffer[len - 1]);
            if (len == (dataLen + 12) && tempBuffer[len - 1] == FunctionCode.tail) {
                return tempBuffer;
            } else {
                // 可能包含发送命令，去掉第一个head，尝试重新截取
                return _parseResponseBuffer(tempBuffer.slice(1));
            }
        }
    }
    return false;
}

function parseData(buf, pointOffset) {
    let res;
    let dataBuffer = _parseResponseBuffer(buf); 
    let len = dataBuffer.length;
    let checksum = dataBuffer[len - 2];
    let remain = dataBuffer.slice(0, len - 2);
    let calculateChecksum = BytesChecksum(remain);
    console.log("#", len, checksum, remain, calculateChecksum);
    // // 校验正确性
    if (checksum == calculateChecksum[0]) {
        var tag = dataBuffer[8];
        var dataLen = dataBuffer[9];
        var start = dataBuffer.indexOf(head);
        var payloadBuffer = dataBuffer.slice(start+10, start+10+dataLen);
        // 返回错误, 电表命令不支持
        if (tag == FunctionCode.error) {
            helper.log("#" + command.options.name + " code: " + command.options.code + " not support");
            res = "0.00";
        }
        else {
            //decode payload
            for (let i = 0; i < payloadBuffer.length; i++) {
                payloadBuffer[i] = payloadBuffer[i] - 0x33;
            }
            //init this.message
            let pointOffset = typeof pointOffset != undefined ? pointOffset : 2;
            let payloadStr = BCD2String(payloadBuffer);
            console.log("---", payloadStr);
            let payloadLen = payloadStr.length; 
            //helper.log("#", pointConf, pointConf[0].id, payloadStr.substr(0, payloadLen - pointOffset), payloadStr.substr(payloadLen - pointOffset));
            res = (payloadStr.substr(0, payloadLen - pointOffset) | "0") + "." + payloadStr.substr(payloadLen - pointOffset);
        }
    } else {
        throw Error("parsePoint failed");
    }
    return res;
}


function readSn(buf) {
    var payloadBuffer = buf.slice(1, 7);
    console.log(payloadBuffer);
    console.log("电表SN:", BCD2String(payloadBuffer));
    return BCD2String(payloadBuffer);
}


// 全部准备完成， 开始发送采集命令
// setTimeout(function(){
//     // 广播电表地址
//     var cmd = readCmd();
//     server.publish(conf.mqtt.prefix+"/"+sn+"/in", cmd);
// }, 1000);

// var str = "68 14 04 00 00 00 00 68 81 06 43 C3 48 B3 C8 33 6B 16";
// //var str = "68 46 45 20 22 00 00 68 11 04 33 33 34 33 7F 16";
// var frame = Buffer.from(str.replace(/ /g,""), 'hex');
// console.log(frame);
// console.log("--------", parseData(frame, 6));


var str = "fe fe fe 68 14 04 00 00 00 00 68 01 02 43 C3 F1 16";
var frame = Buffer.from(str.replace(/ /g,""), 'hex');

var frame = Buffer.from([254,104,5,6,0,0,0,0,104,129,6,67,195,91,124,51,51,165,22,254]);
console.log(frame.toString("hex"));
dataBuffer = _parseResponseBuffer(frame); 
console.log(dataBuffer);
console.log(readSn(dataBuffer));
var len = dataBuffer.length;
var tag = dataBuffer[8];
var dataLen = dataBuffer[9];
var start = dataBuffer.indexOf(head);
var payloadBuffer = dataBuffer.slice(start+10, start+10+dataLen);


console.log(len, tag, dataLen, start, payloadBuffer);
console.log((payloadBuffer.toString('hex')));


// let payloadStr = BCD2String(Buffer.from("01021090", "hex"));
// console.log(payloadStr);
