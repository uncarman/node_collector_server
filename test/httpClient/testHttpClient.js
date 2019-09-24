
const httpClient = require('../../src/httpClient');
const config = require('../../conf/test.json');

var conf = config.httpServerTest;

var hc = null;
hc = new httpClient(conf);
hc.on('end', function (res) {
    console.log('#httpClient post end: ' + res);
});
hc.on('error', function(err) {
    console.log('#httpClient on error: ' + err);
});

setInterval(function(){
	hc.write(JSON.stringify({"a":1}));
}, 2000);
