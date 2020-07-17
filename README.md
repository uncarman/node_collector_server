# 透传采集服务端程序

## 项目说明
适配透传采集器

## 环境配置

#### 1. 安装 `Node.js` 和 `npm`
如果你的机器上还没有 `Node.js` 和 `npm` ， 安装它们 。 该工程需要 `node v10.x.x` 或更高版本以及 `npm 6.x.x` 或更高版本。 
要检查你正在使用的版本，请在终端窗口中运行 
```
node -v
```
和
```
npm -v
```
本项目依赖Node包管理工具（`npm`）管理项目所需的第三方库文件

<br/>


<br/>

#### 3. 安装依赖包
当基本环境确认无误后，在终端命令行中进入本项目根目录，并输入以下命令，使用`npm`来安装`package.json`中列出的依赖包
```
npm install
```
输入该指令后工程目录下应当会出现新的依赖文件夹node_modules，注意安装过程中应当不出现`npm ERR!`信息
> 提示：<br>
　　由于`npm`原资源地址由于网络原因可能出现下载缓慢甚至出错的情况，建议修改`npm`下载地址至淘宝的镜像下载源
>```
>npm config set registry https://registry.npm.taobao.org
>```
>之后输入以下命令确认修改是否成功
>```
>npm info underscore
>```

<br/>



#### 4. 可能问题
如果通过npm镜像安装依赖失败，可尝试用国内镜像
```
npm install -g cnpm --registry=https://registry.npm.taobao.org
```
<br/>

如果遇到 未能加载 Visual C++ 组件“VCBuild.exe”， 需要安装构建工具
```
npm install --global --production windows-build-tools
```




#### 5. 使用注意
注意: 
1. 采集时 a_item.code 即为 设备addr
2. conf/collector_config.js 需要配置一个id为[ind]的点信息, 对应a_item_data.indication字段


启动命令: (其中0对应conf/collector_config.js的第几个配置)
node src/index.js 0

当前为server模式, 运行后监听host:post(conf/collector_config.js中对应配置)等待client连接 
test/tm.js 为模拟的client

采集器配置: conf/collector_config.js, 拿到对应的多个采集器的详细模型, 注: 目前只支持由第一个生成设备点表
collectorId -> Db.a_collector.id
module -> 采集模式: modbus / dlt645
commands -> 对应点表配置

运行时:
1. 读取db.a_collector, 获取所有采集器列表
2. 读取 db.a_item, 获取所有需要采集的设备
3. 读取 conf/collector_config.js 中第一个配置模型, 生成采集器点表
4. 执行采集命令
5. 返回数据到 appServer.js 的 data 事件


#### 6. 测试脚本
test/testTcpServer.js
test/tm.js


#### 7. 代码保护
1. 安装混淆工具 javascript-obfuscator
    npm install -D javascript-obfuscator
2. 安装编码工具 bytenode
    npm install -D bytenode
3. 编写编译脚本 build.js
4. 发布时执行命令 
	node build.js cp    -> 复制src代码到 dist, 并进行混淆
5. 启动命令: 参考package中 c1~c4
	node dist/index.js 0 client
	说明: 载入 conf/collectorConfig.js中ind为0的配置, 载入tcpClient.js逻辑运行采集

	node dist/index.bak.js 1 client
	说明: 载入 conf/collectorConfig.js中ind为1的配置, 载入tcpClient.bak.js逻辑运行采集

	node dist/index.js 2 server
	说明: 载入 conf/collectorConfig.js中ind为2的配置, 载入tcpServer.js逻辑运行采集


