

var redis = require('redis');
const config = require('../../conf/prod.json');
const helper = require('../../src/helper.js');

const sn = "866856030892598";

server = redis.createClient(config.redis.port, config.redis.host, {auth_pass: config.redis.userpass});

server.select(config.redis.db, function (err) {
    if(err){
        helper.log('redis select db error:', err);
    }
});
server.on('error', function (err) {
    helper.log('redis server error:', err);
});
server.on('ready', function (res) {
    helper.log("连接redis服务成功", config.redis.host, config.redis.port);
    
});

var fakeDevice = require('../../test/mqtt/fake-device-dlt645-modbus.json');

setTimeout(function(){
    server.hgetall(config.redis.hKeyName, function(err, res){
        if(err) {
            return null;
        }
        console.log("旧数据", res);
        // // 清空旧数据
        for(i in res) {
            //server.hdel(config.redis.hKeyName, i);
        }
        // // 添加新数据
        //server.hset(config.redis.hKeyName, sn, JSON.stringify(fakeDevice));
    });
}, 1000);

setTimeout(function(){
    server.hgetall(config.redis.hKeyName, function(err, res){
        if(err) {
            return null;
        }
        console.log("新数据", res);
        server.end();
    });
}, 3000);
