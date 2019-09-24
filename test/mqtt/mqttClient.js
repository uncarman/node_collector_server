
var mqtt = require('mqtt');

const config = require('../../conf/test.json');

const sns = ["866856030793721"];

var server = mqtt.connect(config.mqtt.host, config.mqtt);
server.on('connect', function () {
    console.log(new Date(), "[数据采集平台]:连接mqtt服务");
});

server.on('message', function (topic, message) {
	let data = message.toString('hex');
    console.log(new Date(), "[数据采集平台]:接收数据,主题:" + topic + " 数据: "+ data);
});


sns.map(function(sn){
    server.subscribe(config.mqtt.prefix+"/"+sn+"/out", function(err, res){
        console.log(new Date(), "[数据采集平台]:监听 out "+sn);
        if(err){
            console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
        }
    });

    server.subscribe(config.mqtt.prefix+"/"+sn+"/in", function(err, res){
        console.log(new Date(), "[数据采集平台]:监听 in "+sn);
        if(err){
            console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
        }
    });

    server.subscribe(config.mqtt.prefix+"/"+sn+"/log", function(err, res){
        console.log(new Date(), "[数据采集平台]:监听 log "+sn);
        if(err){
            console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
        }
    });

    server.subscribe(config.mqtt.prefix+"/"+sn+"/system", function(err, res){
        console.log(new Date(), "[数据采集平台]:监听 system "+sn);
        if(err){
            console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
        }
    });

    server.subscribe(config.mqtt.prefix+"/"+sn+"/system_out", function(err, res){
        console.log(new Date(), "[数据采集平台]:监听 system_out "+sn);
        if(err){
            console.log(new Date(), "[数据采集平台]:主题订阅出错,设备编号:"+sn);
        }
    });
});
