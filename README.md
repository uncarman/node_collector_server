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
