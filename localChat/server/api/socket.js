import url from "node:url";
import crypto from "node:crypto";
import { proxyEncode, proxyDecode } from '../../common/index.js';
var WS = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

// 报文解析
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
function decodeSocketData(e) {
  var i = 0,
    j,
    s,
    frame = {
      //解析前两个字节的基本数据
      FIN: e[i] >> 7,
      // 0x0 : 代表连续的帧
      // 0x1 : text帧
      // 0x2 ： binary帧
      // 0x3-7 ： 为非控制帧而预留的
      // 0x8 ： 关闭握手帧
      // 0x9 ： ping帧
      // 0xA :  pong帧
      // 0xB-F ： 为非控制帧而预留的
      opcode: e[i++] & 15,
      mask: e[i] >> 7,
      payloadLength: e[i++] & 0x7f,
    };
  //处理特殊长度126和127
  if (frame.payloadLength == 126) frame.payloadLength = (e[i++] << 8) + e[i++];
  if (frame.payloadLength == 127)
    (i += 4), //长度一般用四字节的整型，前四个字节通常为长整形留空的
      (frame.payloadLength =
        (e[i++] << 24) + (e[i++] << 16) + (e[i++] << 8) + e[i++]);
  //判断是否使用掩码
  if (frame.mask) {
    //获取掩码实体
    frame.maskingKey = [e[i++], e[i++], e[i++], e[i++]];
    //对数据和掩码做异或运算
    for (j = 0, s = []; j < frame.payloadLength; j++)
      s.push(e[i + j] ^ frame.maskingKey[j % 4]);
  } else s = e.slice(i, frame.payloadLength); //否则直接使用数据
  //数组转换成缓冲区来使用
  s = Buffer.from(s);
  //如果有必要则把缓冲区转换成字符串来使用
  if (frame.opcode == 1) s = s.toString();
  //设置上数据部分
  frame.payloadData = s;
  //返回数据帧
  return frame;
}

// 将要发给客户端的数据编码为客户端能解析的格式
function encodeSocketData(frame) {
  const bufArr = [];
  const firstByte = Buffer.alloc(1);
  const secondByte = Buffer.alloc(1);
  bufArr.push(firstByte, secondByte);
  firstByte.writeUInt8((frame.fin << 7) + (frame.rsv << 4) + frame.opcode); // 头部第一个头部字节
  const payloadLen = frame.payloadBuffer.length; // 获取要发送的消息体长度
  // payload len = 0 ~ 125 时, payload len 的值就是 payload data(消息体)长度.
  // payload len = 126, 后2个字节才是真实的payload data(消息体)长度.
  // payload len = 127, 后8个字节才是真实的payload data(消息体)长度.
  if (payloadLen > 125) {
    if (payloadLen > 65535) {
      // 后两个字节的最大值为65535, 一旦消息体长度大于65535, 那么使用后8个字节存储消息体长度
      secondByte.writeUInt8((frame.mask << 7) + 127); // 头部第二个字节
      const lenByte = Buffer.alloc(8);
      lenByte.writeUInt32BE(0); // 因为4个字节可表示的消息体长度已经达到2^32次, 所以前四个字节设为0,
      lenByte.writeUInt32BE(payloadLen, 4);
      bufArr.push(lenByte);
    } else {
      secondByte.writeUInt8((frame.mask << 7) + 126); // 头部第二个字节
      const lenByte = Buffer.alloc(2);
      lenByte.writeUInt16BE(payloadLen);
      bufArr.push(lenByte);
    }
  } else {
    secondByte.writeUInt8((frame.mask << 7) + payloadLen); // 头部第二个字节
  }
  bufArr.push(frame.payloadBuffer);
  return Buffer.concat(bufArr);
}

/**
 * 接口处理
 * @this { import('../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  var key;
  req.socket.on("connection", (client) => {
    console.log("客户端连接", client);
  });
  // 接收数据
  req.socket.on("data", function (e) {
    let data = decodeSocketData(e);
    if (data.opcode === 1 || data.opcode=== 2) {
      let payloadData = proxyDecode(data.payloadData);
      console.log(data, payloadData);
      req.socket.write(
        encodeSocketData({
          // 编码数据并发送给客户端
          fin: 1, // 用来标识这是消息的最后一段, 一个消息可能分成多段发送
          rsv: 0, // 默认是0, 用来设置自定义协议, 设置的话双方都必须实现
          opcode: 2, // 操作码, 用来描述该段消息
          mask: 0, // 标识是否需要根据掩码做混淆息计算, 如果为1, 那么会有4个字节存储掩码, 服务器向客户端发送数据不用做混淆运算
          payloadBuffer: Buffer.alloc(data.payloadLength, data.payloadData),
        })
      );
    }
    // res.socket.write(sendData);
  });

  req.socket.on("error", (err) => {
    console.log("连接错误", err);
  });
  req.socket.on("end", () => {
    console.log("断开连接");
  });

  // 响应websocket请求
  key = req.headers["sec-websocket-key"];
  key = crypto
    .createHash("sha1")
    .update(key + WS)
    .digest("base64");
  res.socket.write("HTTP/1.1 101 Switching Protocols\r\n");
  res.socket.write("Upgrade: websocket\r\n");
  res.socket.write("Connection: Upgrade\r\n");
  res.socket.write("Sec-WebSocket-Accept: " + key + "\r\n");
  res.socket.write("\r\n");
}
