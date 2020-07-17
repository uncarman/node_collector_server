// // create an empty modbus client
// var ModbusRTU = require("modbus-serial");
// var client = new ModbusRTU();

// // open connection to a tcp line
// client.connectTCP("192.192.1.249", { port: 502 });
// client.setID(1);

// // read the values of 10 registers starting at address 0
// // on device number 1. and log the values to the console.
// setInterval(function() {
//     client.readHoldingRegisters(34880, 16, function(err, data) {
//         console.log(err);
//         console.log(data);
//     });
// }, 1000);


var conf = [
        // 249 点表
        {
            "host": "192.192.1.249", //"192.192.1.249"
            "port": 502,
            "collectorId": 1,       // 对应collector_id
            "module": "modbus",     // 采集模式 modbus
            "cmdTimeout": 5000,
            "commands": [
                {
                    "options": {
                        "cmdType": "readHoldingRegisters",
                        "startAddress": 34880,
                        "regNum": 16
                    },
                    "points": [
                        {
                            "id": "p0",
                            "itemId": "1",
                            "offset": 0,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p1",
                            "itemId": "2",
                            "offset": 2,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p2",
                            "itemId": "3",
                            "offset": 4,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p3",
                            "itemId": "4",
                            "offset": 6,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p4",
                            "itemId": "5",
                            "offset": 8,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p5",
                            "itemId": "6",
                            "offset": 10,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p6",
                            "itemId": "7",
                            "offset": 12,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        },
                        {
                            "id": "p7",
                            "itemId": "8",
                            "offset": 14,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "F32BE" ]
                            ]
                        }
                    ]
                }
            ]
        }
    ];

var fmtItems = function(msgs) {
	var cmd = conf[0].commands[0];
    cmd.points.map(function(p) {
        if(msgs.hasOwnProperty(p.id)) {
            var s = {
                addr: p.itemId,
                ind: msgs[p.id],
            };
        }
        console.log(s);
    });
}

var msg = {"p0":96586.1484375,"p1":730406.375,"p2":1206628671,"p3":1194939124,"p4":1191543752,"p5":1202760325,"p6":1210047490,"p7":0,"addr":"1","uid":1,"id":292};
fmtItems(msg);