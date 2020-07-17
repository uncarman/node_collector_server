'use strict';

var net = require('net');

// 指定连接的tcp server ip，端口
var options = {
	host : '192.192.1.253',
	port : 4196,
	 host : '127.0.0.1',
	 port : 4196,
	host : '192.192.1.249',
	port : 502,
}

var tcp_client = net.Socket();

// 连接 tcp server
tcp_client.connect(options,function(){
	console.log('connected to Server');
	
	var buff = Buffer.from("fefefe6805060000000068010243C3F116", "hex");
	console.log("send", buff);
	setInterval(function() {
		tcp_client.write(buff);
	}, 3000);
	
})

// 接收数据
tcp_client.on('data',function(data){
	console.log('----- received data:', data);
})

tcp_client.on('end',function(){
	console.log('data end!');
})

tcp_client.on('error', function () {
	console.log('tcp_client error!');
})
