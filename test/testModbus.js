
// const modbus = require('./modbus.js');
// const config = require('../conf/test.json');

var decUtil = require('../src/lib/_decUtil');

// var m = new modbus({
//     host: "192.192.1.249",
//     port: 502,
//     addr: 1,
//     timeout: 2000,
//     autoReconnect: true,
//     reconnectTimeout: 10000,
//     logEnabled: true,
// });

// setInterval(function () {
//     m.readHoldingRegisters(34881, 10);
// }, 2000);


var config = {
	"commands": [
	    {
	        "options": {
	            "cmdType": "readHoldingRegisters",
	            "startAddress": 34881,
	            "regNum": 2
	        },
	        "points": [
	            {
	                "id": "正向有功总",
	                "offset": 0,
	                "regNum": 2,
	                "func": [
	                    [ "swapToBE", "1032" ],
	                    [ "U32BE" ]
	                ]
	            }
	        ]
	    }
	]
};
var ind = 0;
var regLen = 2;

function parsePoint () {
    let dataBuffer = Buffer.from([0x00,0x00,0x00,0x03,0xbf,0x3f,0x01]);
    //parsePoint dataBuffer {"type":"Buffer","data":[0,0,3,191,63,1]}
    console.debug("parsePoint dataBuffer", dataBuffer);
    let command = config.commands[ind];
    // 将Buffer通过点集映射为对象
    let parsedObj = {};
    if(dataBuffer && dataBuffer.length > 0) {
        command.points.map(p => {
            let start = p.offset * regLen;
            let end = start + p.regNum * regLen;
            let funcList = Array(['slice', start, end]).concat(p.func);
            parsedObj[p.id] = decUtil.batch(dataBuffer, funcList);
            return p.id;
        });
    }
    console.debug("parsePoint parsedObj", parsedObj);
    return parsedObj;
};

parsePoint();
