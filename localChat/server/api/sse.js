import url from 'node:url';
/**
 * 接口处理
 * @this { import('../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default function (req, res) {
  // console.log(this.store.subList);
  let reqUrl = url.parse(req.url, true);
  let { roomId, userId } = reqUrl.query;
  res.setHeader("Content-Type", "text/event-stream");
  if (roomId) {
    // 加入房間
    let subList = this.store.subList;
    if (!subList) {
      subList = this.store.subList = {[roomId]: []};
    }
    subList[roomId].push(res);
    // ((this.store.subList || (this.store.subList = {}))[roomId] || (this.store.subList[roomId] = [])).push(res);
    // if (!this.store.subList) {
    //   this.store.subList.push
    // }
    // !this.store.subList && (this.store.subList[roomId] = [])
    // 退出房間
    res.on("close", () => {
      subList[roomId].splice(subList[roomId].indexOf(res), 1);
    });
    // 加入房間
    // this.store.subList[roomId].push(res);
    res.write("");
    return;
  } else {
    res.statusCode = 404;
    res.end();
  }
};
