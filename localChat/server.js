import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import url from 'node:url';
import store from './store.js';
import child_process from 'node:child_process';

let filePath = url.fileURLToPath(import.meta.url)
let dirPath = path.dirname(filePath);
class Server {
  server = null; // 服务
  ssr = null;
  apiCacheList = []; // 接口方法缓存
  store = store;
  srcPath = path.resolve(dirPath, './src');
  port = 8080; // 启动端口
  constructor () {
    this.createServer();
    child_process.exec('vite build --watch')
  }
  createServer () {
    this.server = http.createServer(async (req, res) => {
      let reqUrl = url.parse(req.url, true);
      console.log(reqUrl.pathname);
      // 接口处理
      if (/\/api\//.test(reqUrl.pathname)) {
        try {
          let api = this.apiCacheList[reqUrl.pathname]
          if (!api) {
            let requireFn = await import('.' + reqUrl.pathname + '.js');
            api = requireFn?.default || requireFn;
            this.apiCacheList[reqUrl.pathname] = api;
          }
          api.apply(this, [req, res]);
        } catch (err) {
          console.log(err);
          res.statusCode = 404;
          res.end(JSON.stringify(err))
        }
      } else if (req.method === "GET") {
        try {
          if (reqUrl.pathname === "/") {
            // ssr.apply(this, [req, res]);
            // ssr(req,res).appli
            // try {
              
            //   if (!this.ssr) {
            //     let requireFn = require('./ssr.js');
            //     ssr = requireFn?.default || requireFn;
            //     this.ssr = ssr;
            //   }
            //   this.ssr.apply(this, [req, res]);
            // } catch (err) {
            //   console.log(err);
            //   res.statusCode = 404;
            //   res.end(JSON.stringify(err))
            // }
            res.end(await fs.readFileSync(path.join(dirPath, './src/index.html', )));
          } else {
            let fileUrl = reqUrl.pathname;
            if (/\.js$/.test(fileUrl)) {
              res.setHeader('Content-Type', 'application/javascript')
            }
            fileUrl = path.join(dirPath, './dist', fileUrl);
            res.end(await fs.readFileSync(fileUrl));
          }
        } catch (err) {
          console.log(err);
          res.statusCode = 404;
          res.end();
        }
      } else {
        res.end(await fs.readFileSync(path.join(this.srcPath, "/404.html")));
      }
    }).listen(8080, () => {
      console.log("啟動服務", 'http://localhost:8080');
    });
  }
}
const server = new Server();
export default server
// exports.default = server;