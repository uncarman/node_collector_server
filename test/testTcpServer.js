'use strict';

var net = require('net');


const TcpServ = require("../src/tcp");
const helper = require("../src/helper");
const Db = require("../src/mydb");

global.isDebug = false;

// 指定连接的tcp server ip，端口
var mysqlOpt = {
    "host": "rm-uf67xbt5r3r17jddto.mysql.rds.aliyuncs.com",
    "database": "lp_energy",
    "username": "llproj",
    "password": "asjfy3j7Y@62o@hksowi"
};
var db = new Db(mysqlOpt);

var colServ= null;
colServ = new TcpServ({});
colServ.on("data", function(msg) {
    helper.log("[to server] msg ", msg);
});
colServ.on("warning", function(msg) {
    helper.log("[to server] warning ", msg);
    db.updateWarning(msg);
});

var msg = {"pp":"55.73","uid":"5","pa":"205.85","a":"28.24","pf":"55.67","v":220,"pg":"60.21","pj":"57.34","rm":"100.00",
"ind": "累计指标", "addr":"3","电压":"242","电流":"19"}
var item = {
	"id": 99,
	"code": "3",
	rules: [
	    {
	        "description": "电压过高",
	        "key": "电压",
	        "val": "240",
	        "compare": ">=",
	        "warning_category" : "电过压",
	        "severity": "严重",
	        "err_msg": "电压过高, 请检查",
	        "solution_ref": "切断电路",
	    },
	    {
	        "description": "电流过大",
	        "key": "电流",
	        "val": "10",
	        "compare": ">=",
	        "warning_category" : "电负载超标",
	        "severity": "严重",
	        "err_msg": "电流过高",
	        "solution_ref": "检查是否漏电, 或开启大功率设备",
	    }
	]
} 
colServ.checkWarning(msg, item);
