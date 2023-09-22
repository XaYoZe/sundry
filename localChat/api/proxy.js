
import querystring from 'node:querystring'
import { proxyEncode, proxyDecode } from '../common/index.js';
/**
 * 接口处理
 * @this { import('../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  console.log(this.store.subList);
  // let reqUrl = url.parse(req.url, true);
  // let { roomId, userId } = reqUrl.query;
  if (req.method === "POST") {
    res.setHeader("Content-Type", "application/octet-stream");
    let data = ''
    let arr = [];
    req.on('data', function (chunk) {
        // chunk 默认是一个二进制数据，和 data 拼接会自动 toString
        data += chunk;
        arr.push(...chunk)
    });
    req.on('end', function () {
        try {
          let reqData = proxyDecode(data);
          if (reqData.api) {

          }
          let resData = proxyEncode({
            timing: Date.now() - req.createTime,
            code:200,
            status:true,
            res: {data: `添加数据成功, 請求數據為: ${reqData}`}
          });
          res.end(resData)
        } catch (err) {
          res.statusCode = 404;
          res.end(proxyEncode({
            code: 404, status:true,
            errMsg: JSON.stringify(err),
          }))
        }
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
};
