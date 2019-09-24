
const DataParser = require("../src/dataParser.js");
const modbus = require('../test/modbus.json');

var deviceId = "123"
var mapContent = require('../test/modbus.json');

var p = new DataParser(deviceId, mapContent);

p.on("data", function(msg){
    console.log("DataParser on data: ", msg);
});

p.on("send", function(buff){
	console.log("No. " + p.cmdInd + ": ", buff.toString('hex'));
	if(p.cmdInd == 0) {
		p.feed(buff);
	} else if (p.cmdInd == 1) {
		p.feed(buff);
	} else if (p.cmdInd == 2) {
		p.feed(buff);
	}
});

p.startCollector();
