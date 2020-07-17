

var SerialPort = require("serialport");
var portName = 'COM1'; //定义串口名
var serialPort = new SerialPort( portName, {
   baudRate: 9600,  //波特率
   dataBits: 8,    //数据位
   parity: 'none',   //奇偶校验
   stopBits: 1,   //停止位
   flowControl: false 
}, false); 

serialPort.open(function(error){ 
   if(error){ 
     console.log("打开端口"+portName+"错误："+error);
   }else{  
   	console.log("打开端口成功，正在监听数据中");
     serialPort.on('data',function(data){
     	console.log(data);
     })
   }
});

