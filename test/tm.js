'use strict';

var net = require('net');

// 指定连接的tcp server ip，端口
var options = {
	host : '127.0.0.1',
	port : 7000
}

var tcp_client = net.Socket();

// 连接 tcp server
tcp_client.connect(options,function(){
	console.log('connected to Server');
})

// 接收数据
tcp_client.on('data',function(data){
	console.log('----- received data:', data);
	try {
		// 正常的 json 数据
		data = JSON.parse(data.toString("utf8"));
		if(data.hasOwnProperty("method") && data.method == "getId") {
			tcp_client.write(JSON.stringify({
				sn: "5",
			}));
		}
	} catch (e) {
		// 原样返回
		let bufStr = data.toString('hex');
		let bufTag = bufStr.substr(0, 4);
		let bufBody = bufStr.substr(4);
		var ret = null;
		console.log("recv", bufStr);
		switch (bufBody) {
			case '0000000ac5fe':
			case '0000000ac42f':
			case '000000104406':
				ret = Buffer.from(bufTag + "00010000002301032000090001000200030004000500060007000800090116000B000C000D000E000F", 'hex');
				break;
			case '000000104435':
				ret = Buffer.from(bufTag + "00010000002301032000090001000200030004000500060007000800090116000B000C000D000E000F", 'hex');
				break;
			case 'fefe68121540080001681104333334332216':
				ret = Buffer.from(bufTag + "fefe6812154008000168910833363533333333337616", 'hex');
				break;
			case 'fefe68121540080001681104333335332316':
				ret = Buffer.from(bufTag + "fefe6812154008000168910833373533453333338916", 'hex');
				break;
			case 'fefe6802000000000068110433333433b416':
				ret = Buffer.from("fefefefe6802000000000068910833363533333333337616", 'hex');
				break;
			case 'fefe6802000000000068110433333533b516':
				ret = Buffer.from("fefefefe6802000000000068910833373533453333338916", 'hex');
				break;
			case 'fefe68847122610102681104333334332d16':
				ret = Buffer.from(bufTag + "fefe6884712261010268910833363533333333337616", 'hex');
				break;
			default:
				ret = Buffer.from("", 'hex');
				break;
		}
		console.log("send", ret);
		tcp_client.write(ret);
	}

})

tcp_client.on('end',function(){
	console.log('data end!');
})

tcp_client.on('error', function () {
	console.log('tcp_client error!');
})
