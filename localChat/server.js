import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import url from "node:url";
import store from "./store.js";
import child_process from "node:child_process";

import { createServer } from "vite";

let filePath = url.fileURLToPath(import.meta.url);
let dirPath = path.dirname(filePath);
class Server {
  server = null; // 服务
  ssr = null;
  apiPath = ''
  apiCache = {}; // 接口方法缓存
  fileCache = {}; // 文件缓存
  store = store;
  port = 8080; // 启动端口
  useList = [];
  defaultPathReg = /.*?/
  constructor() {
    this.createServer();
  }
  // 中间件
  use (path, cb) {
    let reg = this.defaultPathReg;
    if (cb) {
      if (typeof path === 'string') {
        reg = new RegExp(path.replace('*', '\.\*\?'))
      } else {
        reg = path
      }
    } else {
      cb = path;
    }
    this.useList.push({reg, cb})
  }
  // 中间件调用
  useCall (req, res, index = 0) {
    let useItem = this.useList[index];
    if (useItem) {
      // console.log(useItem.reg, req.url, useItem.reg.test(req.url))
      // req.urlParse = urlParse
      if (useItem.reg.test(req.urlParse.pathname)) {
        useItem.cb(req, res, this.useCall.bind(this, req, res, index + 1))
      } else {
        this.useCall(req, res, index + 1)
      }
    }
  }
  // 创建服务
  async createServer() {
    const vite = await createServer({
      server: { 
        middlewareMode: true,
        fs: {
          allow: ['./src/', './index.html', './public/', './node_modules/', './common']
        }
      },
      appType: "custom",
    });
    this.use(vite.middlewares);
    // 首页处理
    this.use(/\/(index\.html)?$/, (req, res, next) => {
      fs.readFile(
        path.join(dirPath, "./index.html"),
        { encoding: "utf-8" },
        (err , data) => {
          if (err) {
            next()
            return
          }
          res.end(data);
        }
      );
    })
    // 接口处理
    this.use(/^\/api\//, async (req, res, next) => {
      let pathname = req.urlParse.pathname;
      // 接口缓存
      let api = this.apiCache[pathname];
      if (!api) {
       import("." + pathname + ".js").then(module => {
        api = module.default || module;
        this.apiCache[pathname] = api;
        api.apply(this, [req, res]);
       }).catch(err => {
         res.statusCode = 404;
         res.end(JSON.stringify(err))
       })
      } else {
        api.apply(this, [req, res]);
      }
    })
    // 资源处理
    this.use(async (req, res) => {
      if (this.fileCache[req.urlParse.pathname]) {
        res.end(this.fileCache[req.urlParse.pathname])
        return
      }
      let fileUrl = req.urlParse.pathname;
      if (/\.js$/.test(fileUrl)) {
        res.setHeader("Content-Type", "application/javascript");
      }
      fileUrl = path.join(dirPath, "./dist", fileUrl);
      fs.readFile(fileUrl, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end();
          return
        }
        this.fileCache[req.urlParse.pathname] = data;
        res.end(data);
      })
    })
    // 启动服务
    this.server = http.createServer(async (req, res) => {
      this.parseReqRes(req, res)
      this.useCall(req, res)
    })
      .listen(8080, () => {
        console.log("啟動服務", "http://localhost:8080");
      });
  }
  // req和res添加修改
  parseReqRes (req, res) {
    console.time('接口处理耗时：' + req.url)
    let ip =  req.headers['x-forwarded-for'] || 
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress || '';
    req.ip = ip;
    req.urlParse =url.parse(req.url, true);
    req.createTime = Date.now();
    let end = res.end;
    res.end = function (...item) {
      console.timeEnd('接口处理耗时：' + req.url)
      res.setHeader('x-expend-time', String(Date.now() - req.createTime) + 'ms')
      return end.apply(res, item)
    }
    return req
  }
}
const server = new Server();
export default server;
// exports.default = server;