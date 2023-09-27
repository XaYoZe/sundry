import url from "node:url";
import crypto from 'node:crypto';
var WS = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
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
  if (frame.Opcode == 1) s = s.toString();
  //设置上数据部分
  frame.PayloadData = s;
  //返回数据帧
  return frame;
}

// 编译为socket报文
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


/**
 * 接口处理
 * @this { import('../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  var key;
  req.socket.on('connection', (client) => {
    console.log('客户端连接', client);
  })
  // 接收数据
  req.socket.on("data", function (e) {
      let data = decodeDataFrame(e);
      console.log(data);
      let sendData = encodeDataFrame(`接受到数据`)
      res.socket.write(sendData)
      // res.socket.write(sendData);
  });
  
  req.socket.on("end", () => {
    console.log("断开连接");
  });

  // 响应socket请求
  key = req.headers['sec-websocket-key'];
  key = crypto
    .createHash("sha1")
    .update(key + WS)
    .digest("base64");
  res.socket.write("HTTP/1.1 101 Switching Protocols\r\n");
  res.socket.write("Upgrade: websocket\r\n");
  res.socket.write("Connection: Upgrade\r\n");
  res.socket.write("Sec-WebSocket-Accept: " + key + "\r\n");
  res.socket.write("\r\n");
  res.socket.write("")
}
