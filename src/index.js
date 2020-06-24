'use strict';

global.isDebug = process.argv[3] == "debug" ? true : false;

//const env = process.argv[2] === "prod" ? "prod" : "test";
const ind = typeof process.argv[2] != undefined ? process.argv[2] : 0 ;
const config = require('../conf/conf.json');
const AppServer = require('./appServer.js');
const app = new AppServer(config, ind);

process.env.TZ = 'Asia/Shanghai';

// 开始采集
app.start();
