
var mqtt = require('mqtt');

const config = require('../../conf/prod.json');

const sn = "866856030457095";
//const sn = "866855038873477";

var getJson = {
	"module_sn": sn,
	"mstype": 5,
	"timestamp": parseInt(Date.parse(new Date())/1000),
	"data": {
	}
}

var setJson = {
	"module_sn": sn,
	"mstype": 4,
	"timestamp": parseInt(Date.parse(new Date())/1000),
	"data":{
		"ch_1": {
			"type":0,
			"baud": 9600,
			"data_bits": 8,
			"stop_bits": 1,
			"parity": "none",
			"flow_ctrl": "none"
		},
		"ch_0": {
			"type":0,
			"baud": 1200,
			"data_bits": 8,
			"stop_bits": 1,
			"parity": "even",
			"flow_ctrl": "none"
		}
	}
}


var server = mqtt.connect(config.mqtt.host, config.mqtt);
server.on('connect', function () {
    console.log("[数据采集平台]:连接mqtt服务");
});

server.on('message', function (topic, message) {
	let data = message.toString("utf8");
    console.log("[数据采集平台]:接收数据,主题:" + topic + " 数据: "+ data);
});

server.subscribe(config.mqtt.prefix+"/"+sn+"/system", function(err, res){
    console.log("[数据采集平台]:监听 system "+sn);
    if(err){
        console.log("[数据采集平台]:主题订阅出错,设备编号:"+sn);
    }
});

server.subscribe(config.mqtt.prefix+"/"+sn+"/system_out", function(err, res){
    console.log("[数据采集平台]:监听 system_out "+sn);
    if(err){
        console.log("[数据采集平台]:主题订阅出错,设备编号:"+sn);
    }
});


setTimeout(function(){
	server.publish(config.mqtt.prefix+"/"+sn+"/system", JSON.stringify(getJson));
}, 1000);

