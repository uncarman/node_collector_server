

const os = require('os');
const http = require('http');
const config = require('../../conf/test.json');

var conf = config.httpServerTest;

var server = http.createServer(function(req, res) {
    var token_index = req.rawHeaders.indexOf('Token');
	var token = req.rawHeaders[token_index + 1];
	if (token === conf.token) {
	    switch (req.method) {
	        case 'GET':
	            _handleGetReq(req, res);
	            break;
	        case 'POST':
	            _handlePostReq(req, res);
	            break;
	        default:
	            res.end('Request not support');
	    }
	} else {
	    res.writeHead(401, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Origin': '*' });
	    res.end('401 Unauthorized');
	}
}).listen(conf.port);
server.setTimeout(0);   //设置不超时，所以服务端不会主动关闭连接

console.log('start ', conf.host, conf.port);

function _handlePostReq(req, res) {
    if(req.url.indexOf('/data') == 0) {
        req.setEncoding('utf8');
        req.on('data', (data) => {
            console.log("get post data:", data);
        });
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Origin': '*' });
            res.end();
        })
    } else {
        res.writeHead(403, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Origin': '*' });
        res.end('403 FORBIDDEN');
    }
}