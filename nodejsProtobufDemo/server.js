let express = require('express');
let protobuf = require('protobufjs');
let fs = require('fs');
let path = require('path');
let app = express();
let Root = protobuf.Root;
let root = Root.fromJSON(require('./proto/index.json'));

// 編碼
function enCodeData(desction, data) {
  const dataDesction = root.lookupType(desction); // 要用來加密的消息
  const err = dataDesction.verify(data); // 校驗字段類型
  if (err) {
    console.log(err);
    return
  };
  const message = dataDesction.create(data); // 創建消息體
  const buffer = dataDesction.encode(message).finish(); // 加密
  return buffer;
}

// 解碼
function deCodeData(desction, data) {
  const dataDesction = root.lookupType(desction); // 要用來加密的消息
  const result = dataDesction.decode(data); // 加密
  const obj = dataDesction.toObject(result)
  return obj;
}

// 獲取空間命名
function getReqResName (serviceName ,funcName) {
  const dataDesction = root.lookupService(serviceName); // 要用來加密的消息
  const message = dataDesction.get(funcName);
  return {responseType: message.responseType, requestType: message.requestType }
}

app.use(express.raw({ type: 'application/protobuf' })) // 自定義解析application/protobuf為二進制數據
app.use('/node_modules', express.static('./node_modules')) // 開放訪問權限
app.use('/proto', express.static('./proto')) // 開放訪問權限
app.use('/', express.static('./view')) // 開放訪問權限

app.all('*', function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*");
  //允许的header类型
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  //跨域允许的请求方式 
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
});

// 接口調用
app.post('/api', (req, res) => {
  // 設置content-type
  res.type('application/octet-stream');

  // 解析請求數據包
  let rpcInput = deCodeData('RPCInput', new Uint8Array(req.body));
  // 獲取請求空間命名
  let namespace = getReqResName(rpcInput.obj, rpcInput.func);
  // 解析請求數據
  let data = deCodeData(namespace.requestType, new Uint8Array(rpcInput.req));

  console.log('請求數據', Object.assign({}, rpcInput, {req: data}));


  // 返回數據編譯
  let resData = enCodeData(namespace.responseType, {
    id: 1,
    name: data.username,
    token: 'dafasfsachskjajhcksafhds;hkjfdsdfs'
  });
  // 返回数据包封装
  let rpcOut = enCodeData('RPCOutput', {res: resData});

  // 響應請求
  res.end(rpcOut);
})

app.listen(80, () => {
  console.log('localhost:80');
})