let http = require('http');
let url = require('url');

var port = 8085;
var queue = [];
var queueMaxLen = 100;



http.createServer((req, res)=>{
    return dealRequest(req, res);
}).listen(port,()=>{
    console.log('开启服务器')
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
            console.log('error：'+str+'!!!'+e);
            return false;
        }
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
        } else if(req.method == "POST") {
            console.log(str);
            if(pathname === '/data/carry'){
                if(isJSON(str)) {
                    var d = JSON.parse(str);
                    if(queue.length >= queueMaxLen) {
                        queue.pop();
                    }
                    queue = [d].concat(queue);
                }
                res.write(JSON.stringify(ret));
            } else {
                res.write('请求错误: 目前只支持 /data/carry');
            }
        }
        res.end();
    });
}

