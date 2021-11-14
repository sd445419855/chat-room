/**
 * Node.js 中 websocket 关联外部服务器使用同一端口的方法（适用于 ws、socket-io）
 */

// 第三方 WebSocket、Express，内置 Http
var { WebSocketServer } = require('ws'); 
var { createServer } = require('http'); 
var express = require('express');

// Http 套 Express
var expressApp = express();
var httpServer = createServer(expressApp);     // http 包裹（Decorate装饰）express 的实例 expressApp
var port = 3333;

// 全局变量
let nicknameMap = new Map();    // 存储已连接的 client 的 nickname
let counter = 0;                // 已连接的客户端的数量的累加器
let nicknamePrefix = "AnonymousUser";

// expressApp.listen(port, () => { console.info("Server is running on: " + port); });

// 新建 WebSocket Server 对象，关联 Http Server
const webSocketServer = new WebSocketServer({
  // port: 8888,                    // 青铜操作：单独监听一个端口
  server: httpServer                // 白银操作：监听 http 服务器
  // server: expressApp              // 白银操作之错误操作：websocket-ws 关联外部 http 服务器时，不支持 express 对象，需 http 对象            或被 http 包裹（Decorate装饰）的对象
});

const init = function (){
  bindEvents();
};

// 为 WebSocket Server 事件绑定处理函数
const bindEvents = function (){
  // -- open
  webSocketServer.on('open', handleOpen);
  // -- connection
  webSocketServer.on('connection', handleClientConnection);
  // -- close
  webSocketServer.on('close', handleServerClose);
  // -- error
  webSocketServer.on('error', handleError);
} 

// 定义事件处理函数
// -- open
const handleOpen = function (event){
  console.info("WebSocket opened!", event);
};

// -- connection
const handleClientConnection = function (ws){                     // 一个 ws (WebSocket实例) 对应一个已连接的 client
  console.info("A client connected in。"); 
  // 初始化 client 存活状态为 ture，即活着。
  ws.isAlive = true;
  
  counter++;
  // 生成 client 的默认 nickname
  if (nicknameMap.has(ws) == false) {
    nicknameMap.set(ws, nicknamePrefix.concat(counter));    // string.concat() 拼接字符串 
  }

  // 监听某个 client 的心跳响应事件，当收到 pong 消息时触发。以此事件检查发出去的 ping 包对应的 pong 包（心跳响应包）是否有发过来
  ws.on('pong', handleClientPong);
  // 监听某个 client 的消息事件，当接收到消息时触发
  ws.on('message', (msg) => { handleClientMessage(ws, msg); });
  // 监听某个 client 的关闭事件，当 client 关闭浏览器或调用 close() 时触发
  ws.on('close', (code, reason) => { handleClientClose(code, reason, ws); });

  // 广播登录消息
  broadcast(JSON.stringify({
    type: 'notification',
    nickname: 'System',
    message: "用户 " + nicknameMap.get(ws) + " 进入群聊！"
  }));
};


// ---- heart beat  收到心跳响应 pong 包的处理 
const handleClientPong = function (event){
  // 系统通知该客户端还活着
  console.info("received heart beat of client!");
  // client 存活状态设为 true。
  this.isAlive = true;                                    // 收到心跳响应 pong 包，说明 client 还活着，isAlive 就设为 true
}

// ---- message
const handleClientMessage = function (ws, msg){                    // 注意：message 事件不是通过 server 来绑定的，而是通过 connection 事件对应的处理函数的参数 ws 来绑定的。这一点和前端不一样。    msg 为 Buffer 类型 
  // 查看收到的消息
  console.log('received-string: %s', msg);

  // 转换消息类型：Buffer to String
  let msgObj = JSON.parse(msg.toString());                // Q：为什么收到的消息都是 Buffer 类型的呢？作者的意图，详情未知。

  /**
   * 接口设置
   */
  // 1、修改昵称
  if (msgObj.type == 'modifyNickname') {
    // 修改昵称 Map 的数据
    let previousNickname = nicknameMap.get(ws);
    let newNickname = msgObj.message;
    nicknameMap.set(ws, newNickname);
    // 广播系统改名通知
    broadcast(JSON.stringify({
      type: 'notification',
      nickname: 'system',
      message: previousNickname + " 改名为 " + newNickname
    }));
  }
  // 2、广播用户聊天消息
  if (msgObj.type == 'sendChatMessage') {
    broadcast(JSON.stringify({
      type: 'message',
      nickname: nicknameMap.get(ws),
      message: msgObj.message
    }));
  }
}

// -- close   WebSocket 服务关闭时
const handleServerClose = function (event){
  console.info("WebSocket Server closed!", event);
  // 清除 client 心跳检测的定时器
  clearInterval(intervalId);
};
// -- close from client
const handleClientClose = function(code, reason, ws) {          // (Number,String)
  console.log('WebSocket Client closed! ', 'code: ', code, 'reason: ', reason)
  // 广播 client 离线通知
  broadcast(JSON.stringify({
    type: 'notification',
    nickname: 'System',
    message: "用户 " + nicknameMap.get(ws) + " 退出群聊！"
  }));


 }


// -- error
const handleError = function (error){                        // (Error)
  console.info("WebSocket erred!", error);                  // erred:err + ed
};

// 定期对 client 进行心跳检测
const intervalId = setInterval(() => {
  // console.info('webSocketServer.clients: ', webSocketServer.clients);
  webSocketServer.clients.forEach((element, sameElement, set) => {
    // 检查 client 存活状态
    // -- 当 client 存活为 false 时，则表示上一次发出去的心跳检测 ping 包没有收到对应的心跳响应 pong 包，那么表示该 client 没有心跳了
    if (element.isAlive == false) {
      console.info("client connection is closed!");
      // 终断与该 client 的连接     
      element.terminate();                  // terminate()：Forcibly close the connection. 强制关闭连接。 close()：Initiate a closing handshake. 发起一个关闭连接的请求。   二者作用基本相同，都会触发 client 的 close 事件，只是前者暴力，后者温柔，后者得一会儿才能关闭连接。
      // 返回，跳出当前 client 的后续心跳检查工作
      return;
    }
    // -- 当存活状态为 true 时，则表示上一次发出去的心跳检测 ping 包收到了对应的心跳响应 pong 包，那么表示该 client 还有心跳
    // ---- 可以做些什么，也可以什么都不做，继续下一次检测
    console.info("client connection is keeping alive!");
    // -- 重新发起心跳检测
    // ---- 初始化存活状态为 false
    element.isAlive = false;
    // ---- 发出心跳检测 ping 包，为下次判断存活状态做准备
    element.ping();
  });
  // 关停 WebSocket 服务
  // webSocketServer.close();
}, 3000);

// 定义消息广播方法                                           // 注意：广播是 WebSocket 的关键
const broadcast = function (msg){
  // ws.send(msg);                                          // 错误操作。这样不是广播，而是原路发给发送者。
  let clientArray = webSocketServer.clients;                // 正确操作。server 下有一个属性 clients，保存这所有连接进来的 client 。clients 是个 Set                                        
  clientArray.forEach((element, sameElement, set) => {      // Set 的 forEach 详见：https://www.cnblogs.com/wssdx/p/10738091.html                                       
    element.send(msg);                                                         
  });                                                               
}

// 为 WebSocket Server 事件绑定处理函数
init();

// Http Server 定义接口
expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})

// Http Server 开始监听端口
// expressApp.listen(port, () => { console.info("Server is running on: " + port); });
httpServer.listen(port, () => { console.info("Server is running on: " + port); });
