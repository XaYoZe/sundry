import path from "node:path";
import fs from "node:fs/promises";
import http from "node:http";
import url from "node:url";
import store from "./server/store.js";
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
  port = 8081; // 启动端口
  useList = [];
  defaultPathReg = /.*?/
  isDev = true
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
      if (useItem.reg.test(req.urlParse.pathname)) {
        useItem.cb(req, res, this.useCall.bind(this, req, res, index + 1))
      } else {
        this.useCall(req, res, index + 1)
      }
    }
  }
  // 创建服务
  async createServer() {
    const allow = this.isDev ? ['./views/', './index.html', './node_modules/', './common'] : [, './dist/'];
    const entryHtml = path.join(dirPath, this.isDev ? './index.html' : "./dist/index.html")
    if (this.isDev) {
      const vite = await createServer({
        server: { 
          middlewareMode: true,
          fs: {
            allow
          }
        },
        appType: "custom",
      });
      this.use(vite.middlewares);
    }
    
    // 接口处理
    this.use(/^\/api\//, async (req, res, next) => {
      let pathname = req.urlParse.pathname;
      // 接口缓存
      let api = this.apiCache[pathname];
      if (!api) {
        try {
          await fs.access("./server" + pathname + ".js");
          import("./server" + pathname + ".js").then(module => {
            api = module.default || module;
            this.apiCache[pathname] = api;
            api.apply(this, [req, res]);
          }).catch(err => {
            console.log(err);
            res.statusCode = 404;
            res.end('接口错误')
          })
        } catch (err) {
          next() 
        }
      //  import("./server" + pathname + ".js").then(module => {
      //   api = module.default || module;
      //   this.apiCache[pathname] = api;
      //   api.apply(this, [req, res]);
      //  }).catch(err => {
      //   next()
      //   //  res.statusCode = 404;
      //   //  res.end(JSON.stringify(err))
      //  })
      } else {
        api.apply(this, [req, res]);
      }
    })
    this.use(/\.(js|css|\w+)$/, async (req, res, next) => {
      console.log(req.urlParse.pathname, req.headers.accept);
      for (let i = 0; i < allow.length; i++) {
        try {
          let filePath = path.resolve(dirPath, allow[i],'./' + req.urlParse.pathname);
          let fileRes = null;
          if (this.fileCache[filePath]) {
            fileRes = this.fileCache[filePath]
          } else {
            fileRes = await fs.readFile(filePath);
          }
          if (/\.js$/.test(filePath)) {
            res.setHeader("Content-Type", "text/javascript");
          }
          this.fileCache[req.urlParse.pathname] = fileRes;
          res.end(fileRes);
          return
        } catch (err) {
          // console.log(err);
        }
      }
      res.statusCode = 404;
      res.end();
    })

    this.use(/.*/, async (req, res, next) => {
      try {
        let template = this.fileCache[req.urlParse.pathname];
        if (!template) {
          template = await fs.readFile(entryHtml, { encoding: "utf-8" });
          this.fileCache[req.urlParse.pathname] = template;
        }
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end(template);
        return
      } catch (err) {
        console.log(err);
      }
      next()
    })
    // 首页处理
    // this.use(/\/(index\.html)?$/, (req, res, next) => {
    //   fs.readFile(
    //     path.join(dirPath, "./index.html"),
    //     { encoding: "utf-8" },
    //     async (err , data) => {
    //       if (err) {
    //         next()
    //         return
    //       }
    //       let html = await vite.transformIndexHtml(req.url, data)
    //       let {render} = await  vite.ssrLoadModule('./src/entry-server.js')
    //       let renderer = await render(req);
    //       router = renderer.router;
    //       html = html.replace('<!--server-html-->', renderer.html)
    //       console.log(html)
    //       res.end(html);
    //     }
    //   );
    // })
    // 资源处理
    this.use(async (req, res) => {
      if (this.fileCache[req.urlParse.pathname]) {
        res.end(this.fileCache[req.urlParse.pathname])
        return
      }
      let fileUrl = req.urlParse.pathname;
      if (/\.js$/.test(fileUrl)) {
        res.setHeader("Content-Type", "text/javascript");
      }
      fileUrl = path.join(dirPath, "./dist", fileUrl);
      try {
        let fileData = await fs.readFile(fileUrl);
        this.fileCache[req.urlParse.pathname] = fileData;
        res.end(fileData);
      } catch (err) {
        res.statusCode = 404;
        res.end();
        return
      }
    })
    
    // 启动服务
    this.server = http.createServer(async (req, res) => {
      this.parseReqRes(req, res)
      this.useCall(req, res)
    }).listen(this.port, () => {
      console.log("啟動服務", "http://localhost:" + this.port);
    });
  }
  // req和res添加修改
  parseReqRes (req, res) {
    let createTime = new Date();
    let reqUrl = req.url;
    let ip =  req.headers['x-forwarded-for'] || 
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress || '';
    req.ip = ip;
    // console.time(`${createTime.toLocaleString()}, ${ ip }, 耗时：${ reqUrl }`)
    req.urlParse = url.parse(reqUrl, true);
    let end = res.end;
    res.end = function (...item) {
      // console.timeEnd(`${createTime.toLocaleString()}, ${ ip }, 耗时：${ reqUrl }`)
      return end.apply(res, item)
    }
    return req
  }
}
const server = new Server();
export default server;
// exports.default = server;
