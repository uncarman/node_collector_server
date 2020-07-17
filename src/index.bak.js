'use strict';

global.isDebug = process.argv[4] == "debug" ? true : false;

//const env = process.argv[2] === "prod" ? "prod" : "test";
const ind = typeof process.argv[2] != undefined ? process.argv[2] : 0 ;
const collectType = typeof process.argv[3] != undefined ? process.argv[3] : 'server' ;
const config = require('./conf/sysConfig').sysConfig();

var TcpServ = require("./tcpServer");
if(collectType == "client") {
    TcpServ = require("./tcpClient.bak");
}

const AppServer = require('./appServer');
const app = new AppServer(config, TcpServ, ind);

process.env.TZ = 'Asia/Shanghai';

// 开始采集
app.start();
