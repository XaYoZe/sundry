import url from 'node:url';

/**
 * 接口处理
 * @this { import('../server.js').defualt }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  console.log(this.store.subList);
  let reqUrl = url.parse(req.url, true);
  let { roomId, userId, text } = reqUrl.query;
  let data = { roomId, userId, text };
  // if (!sessionStorage[roomId]) {
  //   sessionStorage[roomId] = [];
  // }
  // sessionStorage[roomId].push(data);
  this.store.subList[roomId]?.forEach((subRes) => {
    subRes.write(`id: ${roomId}\n`);
    subRes.write("event: message\n");
    subRes.write(`data: ${JSON.stringify(data)}`);
    subRes.write("\n\n");
  });
  this.
  // sendData(roomId, userId, text);
  res.end();
};
