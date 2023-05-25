let path = require("path");
let fs = require("fs");
let http = require("http");
let url = require("url");

let subList = {};
let sessionStorage = {};

function sendData(roomId, userId, text) {
  let data = { roomId, userId, text };
  if (!sessionStorage[roomId]) {
    sessionStorage[roomId] = [];
  }
  sessionStorage[roomId].push(data);
  subList[roomId]?.forEach((subRes) => {
    subRes.write(`id: ${roomId}\n`);
    subRes.write("event: message\n");
    subRes.write(`data: ${JSON.stringify(data)}`);
    subRes.write("\n\n");
  });
}

let sseService = http.createServer(async (req, res) => {
  let reqUrl = url.parse(req.url, true);
  console.log(reqUrl.pathname);
  if (req.method === "GET") {
    if (reqUrl.pathname === "/") {
      res.end(await fs.readFileSync(path.resolve("./pages/sse.html")));
    } else if (fs.existsSync(path.resolve("./pages", `.${reqUrl.pathname}`))) {
      res.end(
        await fs.readFileSync(path.resolve("./pages", `.${reqUrl.pathname}`))
      );
    } else if (reqUrl.pathname === "/eventSource") {
      res.setHeader("Content-Type", "text/event-stream");
      let { roomId, userId } = reqUrl.query;
      if (roomId) {
        if (!subList[roomId]) {
          subList[roomId] = [];
        }
        // 退出房間
        res.on("close", () => {
          console.log("關閉連接");
          subList[roomId].splice(subList[roomId].indexOf(res), 1);
        });
        // 加入房間
        subList[roomId].push(res);
        res.write("");
        return;
      } else  {
        res.statusCode = 404;
        res.end();
      }
    } else if (reqUrl.pathname === "/sendData") {
      let { roomId, userId, text } = reqUrl.query;
      sendData(roomId, userId, text);
      res.end();
    } else if (reqUrl.pathname === "/history") {
      let { roomId } = reqUrl.query;
      res.end(JSON.stringify(sessionStorage[roomId]));
    }
    // res.statusCode = 404;
    // res.end('404')
  }
});
sseService.listen(8080, () => {
  console.log("啟動服務");
});
