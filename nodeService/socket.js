const crypto = require("crypto"),
url = require("url"),
net = require("net"),
http = require("http"),
path = require('path'),
fs = require('fs'),
{exec} = require('child_process');

//net創建socket
let netSocketList = [];
net
  .createServer(function (socket) {
    let key;
    socket.on("data", function (data) {
      if (!key) {
        key = data.toString().match(/Sec-WebSocket-Key: (.*)/)[1];
        socket.write(resHeaders(key));
        netSocketList.push(socket)
      } else {
        data = decodeDataFrame(data);
        if (data.Opcode === 8) {
          socket.end()
          return
        }
        netSocketList.forEach(item => {
          item.write(encodeDataFrame(data.PayloadData));
        })
      }
    });
    socket.on("error", () => {
      console.log("断开连接");
    });
    socket.on("end", () => {
      console.log("断开连接");
    });
  })
  .listen(8090, () => {
    console.log("net socket:8090");
  });

// http創建
let httpServer = http.createServer();
httpServer.on('request', async (req, res) => {
  let reqUrl = url.parse(req.url, true);
  console.log(reqUrl.pathname);
  if (req.method === "GET") {
    if (reqUrl.pathname === "/") {
      res.end(await fs.readFileSync(path.resolve("./pages/socket.html")));
    } else if (fs.existsSync(path.resolve("./pages", `.${reqUrl.pathname}`))) {
      res.end(
        await fs.readFileSync(path.resolve("./pages", `.${reqUrl.pathname}`))
      );
    }
  }
})
let httpSocketList = [];
httpServer.on("upgrade", (req, socket) => {
  socket.on("data", (data) => {
    data = decodeDataFrame(data);
    httpSocketList.forEach(item => {
      item.write(encodeDataFrame(data.PayloadData));
    })
  });
  socket.write(resHeaders(req.headers["sec-websocket-key"]));
  httpSocketList.push(socket);
});
httpServer.listen(8080, () => {
  console.log("啟動服務");
  exec('start http://localhost:8080');
});

// 握手
function resHeaders(key) {
  const WS = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  key = crypto
    .createHash("sha1")
    .update(key + WS)
    .digest("base64");
  return (
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    `Sec-WebSocket-Accept: ${key}\r\n` +
    "\r\n"
  );
}


/**
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
 */
function decodeDataFrame(e) {
  var i = 0,
    j,
    s,
    frame = {
      //解析前两个字节的基本数据
      FIN: e[i] >> 7,
      Opcode: e[i++] & 15,
      Mask: e[i] >> 7,
      PayloadLength: e[i++] & 0x7f,
    };
  //处理特殊长度126和127
  if (frame.PayloadLength == 126) frame.PayloadLength = (e[i++] << 8) + e[i++];
  if (frame.PayloadLength == 127)
    (i += 4), //长度一般用四字节的整型，前四个字节通常为长整形留空的
      (frame.PayloadLength =
        (e[i++] << 24) + (e[i++] << 16) + (e[i++] << 8) + e[i++]);
  //判断是否使用掩码
  if (frame.Mask) {
    //获取掩码实体
    frame.MaskingKey = [e[i++], e[i++], e[i++], e[i++]];
    //对数据和掩码做异或运算
    for (j = 0, s = []; j < frame.PayloadLength; j++)
      s.push(e[i + j] ^ frame.MaskingKey[j % 4]);
  } else s = e.slice(i, frame.PayloadLength); //否则直接使用数据
  //数组转换成缓冲区来使用
  s = Buffer.from(s);
  //如果有必要则把缓冲区转换成字符串来使用
  if (frame.Opcode == 1 || frame.Opcode == 8) s = s.toString();
  //设置上数据部分
  frame.PayloadData = s;
  //返回数据帧
  return frame;
}
function encodeDataFrame(message) {
  const messageLength = Buffer.byteLength(message, "utf8");
  const messageBuffer = Buffer.alloc(messageLength + 2);
  // 0x0 : 代表连续的帧
  // 0x1 : text帧
  // 0x2 ： binary帧
  // 0x3-7 ： 为非控制帧而预留的
  // 0x8 ： 关闭握手帧
  // 0x9 ： ping帧
  // 0xA :  pong帧
  // 0xB-F ： 为非控制帧而预留的
  messageBuffer.writeUInt8(0x81, 0);
  messageBuffer.writeUInt8(messageLength, 1);
  messageBuffer.write(message, 2, messageLength, "utf8");
  return messageBuffer;
}
