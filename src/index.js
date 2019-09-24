//'use strict';

isDebug = process.argv[3] == "debug" ? true : false;

const env = process.argv[2] === "prod" ? "prod" : "test";
const config = env === 'prod' ? require('../conf/prod.json') : require('../conf/test.json');
const AppServer = require('./appServer.js');
const app = new AppServer(config);

// 开始采集
app.start(env);
