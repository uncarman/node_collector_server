
/*
测试安装设备后所有地址是否线路通信正常
运行方式：
	1. 修改addr地址范围
	2. 修改当前网关为正确的sn
	3. 运行命令 node test_communicat.js
*/

isDebug = process.argv[2] == "debug" ? true : false;

var mqtt = require('mqtt');
const conf = require('../conf/prod.json');
const DataParser = require("../src/dataParser.js");

var parser, server;

// 设备sn
var sn = "866856030598930";

// 设备地址范围
var addr = {
	"from": 35,
	"to": 50
};

// modbus的具体配置
var modbus_options = {
	"cmdType": "readInputRegisters",
	"startAddress": 3004,
	"regNum": 25
}

// dlt645的具体配置
var dlt645_options = {
	"module": "dlt645",
    "dName": "dlt645",
    "address": "10010786619",
}

// 当前测试的方式
var current_test = "config_485";  // config_645, config_485

// 生成采集逆变器的config配置
var config_485 = [];
for(var i= addr.from; i<= addr.to; i++) {
	config_485.push({
		address: i,
		module: "modbus",
        dName: "jinlang",
		"commands": [
      {
        "options": {
          "cmdType": "readInputRegisters",
          "startAddress": 3002,
          "regNum": 38
        },
        "points": [
          {
            "id": "outType",
            "offset": 0,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"]
            ]
          },
          {
            "id": "activePower",
            "offset": 2,
            "regNum": 2,
            "func": [
              ["swapToBE", "3210"],
              ["U32BE"]
            ]
          },
          {
            "id": "directSidePower",
            "offset": 4,
            "regNum": 2,
            "func": [
              ["swapToBE", "3210"],
              ["U32BE"]
            ]
          },
          {
            "id": "totalEnergy",
            "offset": 6,
            "regNum": 2,
            "func": [
              ["swapToBE", "3210"],
              ["U32BE"]
            ]
          },
          {
            "id": "dailyEnergy",
            "offset": 12,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "voltage1",
            "offset": 19,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "voltage2",
            "offset": 21,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "voltage3",
            "offset": 23,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "voltage4",
            "offset": 25,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "current1",
            "offset": 20,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "current2",
            "offset": 22,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "current3",
            "offset": 24,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "current4",
            "offset": 26,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "ab",
            "offset": 31,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "bc",
            "offset": 32,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "ca",
            "offset": 33,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "ai",
            "offset": 34,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "bi",
            "offset": 35,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "ci",
            "offset": 36,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          }
        ]
      },
      {
        "options": {
          "cmdType": "readInputRegisters",
          "startAddress": 3041,
          "regNum": 33
        },
        "points": [
          {
            "id": "temp",
            "offset": 0,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "factor",
            "offset": 18,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"],
              ["divide", 10, 2]
            ]
          },
          {
            "id": "status",
            "offset": 2,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          },
          {
            "id": "sn1",
            "offset": 19,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"]
            ]
          },
          {
            "id": "sn2",
            "offset": 20,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"]
            ]
          },
          {
            "id": "sn3",
            "offset": 21,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"]
            ]
          },
          {
            "id": "sn4",
            "offset": 22,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["U16BE"]
            ]
          },
          {
            "id": "w1",
            "offset": 25,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          },
          {
            "id": "w2",
            "offset": 26,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          },
          {
            "id": "w3",
            "offset": 27,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          },
          {
            "id": "w4",
            "offset": 28,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          },
          {
            "id": "w5",
            "offset": 29,
            "regNum": 1,
            "func": [
              ["swapToBE", "10"],
              ["hex"]
            ]
          }
        ]
      }
    ]
	});
}

// 生成电表的config
config_645 = [];
config_645.push({
	"module": dlt645_options.module,
    "dName": dlt645_options.dName,
    "address": dlt645_options.address,
    "customer": {
        "formatter": "formatter"
    },
	"commands": [
		{
            "options": {
                "name": "positive_active_power",
                "code": "00010000"
            },
            "points":[
                {"id": "positive_active_power", "dotPosition": 2 }
            ]
        },
        {
            "options": {
                "name": "reverse_active_power",
                "code": "00020000"
            },
            "points":[
                {"id": "reverse_active_power", "dotPosition": 2 }
            ]
        }
	]
});

var config_muilt = {
    "config_485": config_485,
    "config_645": config_645,
}

//console.log(JSON.stringify(config));

parser = new DataParser(sn, config_muilt[current_test]);
parser.on("data", function(msg){
    console.log(new Date(), "data", msg);
});
// 当拿到采集器下单个的设备采集结束
parser.on("fdata", function(msg){
    // 采集完成, 移除正在运行的设备编号
    console.log(new Date(), "命令发送结束。", msg);
    server.end();

});
// 拿到需要发送的命令执行消息推送
parser.on("send", function(cmd) {
    console.log(new Date(), "发送命令：", cmd);
    server.publish(conf.mqtt.prefix+"/"+sn+"/in", cmd);
});


// 准备测试的mqttClient
server = mqtt.connect(conf.mqtt.host, conf.mqtt);
server.on('connect', function () {
    console.log(new Date(), "[数据采集平台]:连接mqtt服务");
});
server.on('message', function (topic, message) {
	let data = message.toString('hex');
    console.log(new Date(), "[数据采集平台]:接收数据,主题:" + topic + " 数据: "+ data);
    parser.feed(message);
});
// server.subscribe(conf.mqtt.prefix+"/"+sn+"/in", function(err, res){
//     console.log(new Date(), "[数据采集平台]:监听 in "+sn);
//     if(err){
//         console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
//     }
// });
server.subscribe(conf.mqtt.prefix+"/"+sn+"/out", function(err, res){
    console.log(new Date(), "[数据采集平台]:监听 out "+sn);
    if(err){
        console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
    }
});


// 全部准备完成， 开始发送采集命令
setTimeout(function(){
	parser.startCollector();
}, 1000);
