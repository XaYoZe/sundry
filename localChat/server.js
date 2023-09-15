let path = require("path");
let fs = require("fs");
let http = require("http");
let url = require("url");
let store = require('./store');
// let http = require('http2')
// http2.createSecureServer

// let subList = {};
// let sessionStorage = {};

// function sendData(roomId, userId, text) {
//   let data = { roomId, userId, text };
//   if (!sessionStorage[roomId]) {
//     sessionStorage[roomId] = [];
//   }
//   sessionStorage[roomId].push(data);
//   subList[roomId]?.forEach((subRes) => {
//     subRes.write(`id: ${roomId}\n`);
//     subRes.write("event: message\n");
//     subRes.write(`data: ${JSON.stringify(data)}`);
//     subRes.write("\n\n");
//   });
// }

// let apiList = {};

// let sseService = http.createServer(async (req, res) => {
//   let reqUrl = url.parse(req.url, true);
//   console.log(reqUrl.pathname);
//   // 接口处理
//   if (/\/api\//.test(reqUrl.pathname)) {
//     try {
//       let api = apiList[reqUrl.pathname] || require('/api/' + reqUrl.pathname.replace('/api/') + '.js');
//       console.log(api);
//     } catch (err) {
//       res.statusCode = 404;
//       res.end(err)
//     }
//   }
//   if (req.method === "GET") {
//     if (reqUrl.pathname === "/") {
//       res.end(await fs.readFileSync(path.resolve("./pages/sse.html")));
//     } else if (fs.existsSync(path.resolve("./pages", `.${reqUrl.pathname}`))) {
//       res.end(
//         await fs.readFileSync(path.resolve("./pages", `.${reqUrl.pathname}`))
//       );
//     } else if (reqUrl.pathname === "/eventSource") {
//       res.setHeader("Content-Type", "text/event-stream");
//       let { roomId, userId } = reqUrl.query;
//       if (roomId) {
//         if (!subList[roomId]) {
//           subList[roomId] = [];
//         }
//         // 退出房間
//         res.on("close", () => {
//           console.log("關閉連接");
//           subList[roomId].splice(subList[roomId].indexOf(res), 1);
//         });
//         // 加入房間
//         subList[roomId].push(res);
//         res.write("");
//         return;
//       } else  {
//         res.statusCode = 404;
//         res.end();
//       }
//     } else if (reqUrl.pathname === "/sendData") {
//       let { roomId, userId, text } = reqUrl.query;
//       sendData(roomId, userId, text);
//       res.end();
//     } else if (reqUrl.pathname === "/history") {
//       let { roomId } = reqUrl.query;
//       res.end(JSON.stringify(sessionStorage[roomId]));
//     }
//     // res.statusCode = 404;
//     // res.end('404')
//   }
// });
// sseService.listen(8080, () => {
//   console.log("啟動服務");
// });

class Server {
  server = null; // 服务
  apiCacheList = []; // 接口方法缓存
  store = store;
  srcPath = path.resolve(__dirname, './src');
  port = 8080; // 启动端口
  constructor () {
    this.createServer();
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
            let requireFn = require('.' + reqUrl.pathname + '.js');
            api = requireFn?.default || requireFn;
            this.apiCacheList[reqUrl.pathname] = api;
          }
          api.apply(this, [req, res]);
          // console.log(api);
          // if (reqUrl.pathname === "/eventSource") {
          //   res.setHeader("Content-Type", "text/event-stream");
          //   let { roomId, userId } = reqUrl.query;
          //   if (roomId) {
          //     if (!subList[roomId]) {
          //       subList[roomId] = [];
          //     }
          //     // 退出房間
          //     res.on("close", () => {
          //       console.log("關閉連接");
          //       subList[roomId].splice(subList[roomId].indexOf(res), 1);
          //     });
          //     // 加入房間
          //     subList[roomId].push(res);
          //     res.write("");
          //     return;
          //   } else  {
          //     res.statusCode = 404;
          //     res.end();
          //   }
          // } else if (reqUrl.pathname === "/sendData") {
          //   let { roomId, userId, text } = reqUrl.query;
          //   sendData(roomId, userId, text);
          //   res.end();
          // } else if (reqUrl.pathname === "/history") {
          //   let { roomId } = reqUrl.query;
          //   res.end(JSON.stringify(sessionStorage[roomId]));
          // }
        } catch (err) {
          console.log(err);
          res.statusCode = 404;
          res.end(JSON.stringify(err))
        }
      } else if (req.method === "GET") {
        console.log(reqUrl);
        try {
          if (reqUrl.pathname === "/") {
            res.end(await fs.readFileSync(path.join(this.srcPath, "/index.html")));
          } else {
            res.end(await fs.readFileSync(path.join(this.srcPath, reqUrl.pathname)));
          }
        } catch (err) {
          console.log(err);
          res.end(await fs.readFileSync(path.join(this.srcPath, "/404.html")));
        }
        // res.statusCode = 404;
        // res.end('404')
      } else {
        res.end(await fs.readFileSync(path.join(this.srcPath, "/404.html")));
      }
    }).listen(8080, () => {
      console.log("啟動服務", 'http://localhost:8080');
    });
  }
}
const server = new Server();
exports.default = server;