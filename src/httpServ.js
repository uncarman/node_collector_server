
// 针对曼顿开发获取实时数据服务

let http = require('http');
let url = require('url');
let querystring = require('querystring');
const Db = require("./mydb");
const helper = require("./helper");

const env = process.argv[2] === "prod" ? "prod" : "test";
const config = require('./conf/sysConfig').sysConfig();

var port = 8080;
var queue = [];
var queueMaxLen = 80;

let cmdMap = {
    // 命令控制
    "GETCMD": "2. 获取命令",
    "HASCLIENT": "① 是否有用户登录这个设备（通过服务器）",
    "SETRATE": "② 设置实时数据 POSTRT 上传频率",
    "OCSWITCH": "③ 线路开关操作命令",
    "SWITCHLEAK": "④ 漏电检测",
    "SETAUTOLEAK": "⑤ 自动漏电自检设置",
    "SETWIRELESS": "⑥ 网络设置",
    "SETLOGINPWD": "⑦ 修改设备密码",
    "SWITCHSET": "⑧ 线路的功率限定和名称修改",
    "UPDATEALARM": "⑨ 修改告警信息",
    "UPDATEDEVICES": "⑩ 添加或修改电器",
    "UPDATETIMER": "⑪添加或修改定时",
    "DELDEVICES": "⑫删除电器",
    "DELTIMER": "⑬删除定时命令数据",
    "DELALARMES": "⑭删除信息命令数据",
    "SETCONTROL": "⑮设置线路是否能遥控",
    "SETVISIBILITY": "⑯设置线路是否显示",
    "DELDEVICESES": "⑰同时删除多个电器",
    "DELTIMERES": "⑱同时删除多个定时",
    "SETWIRING": "⑲设置线路的接线模式",
    "SETTIMEZONE": "⑳ 设置时区",
    "UPGRADING": "21 远程升级",
    // 实施数据
    "POSTRT": "3. 上传实时数据",
    "POSTALARM": "4. 上传告警",
    "POSTDEVICE": "5. 上传电器数据",
    "POSTTIMER": "6. 上传定时数据",
    "POSTPOWER": "7. 上传电量数据",  // 重要
    "POSTVOLTAGE": "8. 上传平均电压数据", // 每小时或每天平均电压数 据
    "POSTCURRENT": "9. 上传电流数据",  // 每小时或每天平均电流数 据
    "POSTMSGPUSH": "10. 推送最新消息",
    "POSTTEMPERATURE": "11. 上传温度统计数据",  // 提交设备的每小时或每天的最高温度数据
    "POSTLEAKAGE": "13. 上传漏电流统计数据",  // 设备的每小时或每天平均漏电流数据
};
var whiteList = ["POSTRT"]; //, "POSTALARM", "POSTPOWER"];

let db = new Db(config.mysql);
let items = {};

Promise.all([db.getItems()]).then(data => {
    data[0].map((d) => {
        items[d.code] = d;
    });
    helper.log(Object.keys(items).length);
});


http.createServer((req, res)=>{
    return dealRequest(req, res);
}).listen(port,()=>{
    helper.log('开启服务器')
});



function isJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj=JSON.parse(str);
            if(typeof obj == 'object' && obj ){
                return true;
            }else{
                return false;
            }

        } catch(e) {
            helper.log('error：'+str+'!!!'+e);
            return false;
        }
    }
}

function fmtData(data) {
    if(data.substr(-3) == "%0A") {
        let res = data.split("%0A").map( (s) => {
            try {
                s = unescape(s.trim())
                s = Buffer.from(s, 'base64').toString('utf8')
            } catch (e) {
                helper.log(e.message);
            }
            return s
        });
        return res.join("");
    } else {
        return Buffer.from(data, 'base64').toString('utf8');
    }
}

function dealRequest(req, res) {
    //路由：根据不同的路径返回不同的内容
    let {pathname,query} = url.parse(req.url,true);

    res.setHeader('Content-Type','text/plain;charset=utf8');
    let str = "";
    let ret = {
            "ret": "success",
            "control": null,
        };

    req.on('data',(data) => {
        str += data;
    });
    req.on('end',()=>{
        if(req.method == "GET") {
            if(pathname === '/data/carry'){
                res.write(JSON.stringify(queue));
            } else {
                res.write("服务器正常启动");
            }
            res.end();
        } else if(req.method == "POST") {
            if(pathname === '/data/carry'){
                try {
                    let data = querystring.parse(str);
                    if(data["mac"] && data["mac"] != "") {
                        if(queue.length >= queueMaxLen) {
                            queue.pop();
                        }

                        if(data.content != "") {
                            let content = fmtData(data.content); //Buffer.from(data.content, 'base64').toString('ascii');
                            content = JSON.parse(content);
                            // 更新数据到db
                            if(data.cmd == "POSTRT") {
                                //console.log(content);
                                let itemCode = content.serverinfo.loginid;
                                Object.keys(content.distributbox.Breakers).map((k) => {
                                    let d = content.distributbox.Breakers[k];
                                    try {
                                        d.id = items[itemCode+"-"+d.addr].id;
                                        d.ind = d.power;
                                        db.updateData(d);
                                    } catch (e) {
                                        // pass
                                        console.log("item id not find: ", JSON.stringify(d));
                                    }
                                });
                            }
                            content._cmd = data.cmd;
                            content._cmdName = cmdMap[data.cmd] || "未知";
                            if(whiteList.indexOf(data.cmd) >= 0) {
                                queue = [content].concat(queue);
                            }
                        }
                    }
                } catch(e) {
                    console.log(e.message, str);
                }
                res.write(JSON.stringify(ret));
            } else {
                res.write('请求错误: 目前只支持 /data/carry');
            }
            res.end();
        }
        res.end();
    });
}

