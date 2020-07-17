'use strict';

var net = require('net');

// 指定连接的tcp server ip，端口
var options = {
    host : '127.0.0.1',
    port : 4196,
    collectorId: 1,
}

var server = null;
var sockets = {};

server = net.createServer(function (socket) {
    console.log('connect collector: ' + socket.remoteAddress + ':' + socket.remotePort);
    var connection = socket.remoteAddress + ':' + socket.remotePort;
    sockets[connection] = socket;
    socket.inited = false;
    socket.connection = connection;
    socket.sn = options.collectorId; // 采集器标识
    socket.dataParsers = {};

    socket.setKeepAlive(true, 300000);

    socket.on('data', function(data) {
        dealRes(socket, data);
    });

    socket.on('close', function() {
        // clear connectionMap info
        if (sockets.hasOwnProperty(connection)) {
            console.log('#', connection, 'disconnect, update map');
            delete sockets[connection];
        }
    });

    socket.on('end', function() {
        console.log('# on end');
    });

    socket.on('error', function(error) {
        console.log('# on error:', error.message);
    });

});

function dealRes(socket, data) {
    console.log("dealRes", socket.sn, data);
    try {
        // 正常的 json 数据
        data = JSON.parse(data.toString("utf8"));
        if(data.hasOwnProperty("method") && data.method == "getId") {
            socket.write(JSON.stringify({
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
        //ret = Buffer.from(bufTag + "A50C47BC50354932B13947EB52E6473972FB4705AA8547B0DC02481F00000000", "hex");
        ret = Buffer.from(bufTag + "fefe6814040000000068810643C348B3C8336B16", "hex");
        console.log("send", ret);
        socket.write(ret);
    }
}


var host = options.host;
var port = options.port;
console.log('listening ' + host + ' port ' + port);
server.listen(port, host);


//"01 03 00 00 00 03 bf 3f 01"