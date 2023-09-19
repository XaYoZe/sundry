// const http = require('http')

import url from 'node:url';
/**
 * 接口处理
 * @this { import('../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  console.log(this.store.subList);
  let reqUrl = url.parse(req.url, true);
  let { roomId } = reqUrl.query;
  res.end("{}");
};
