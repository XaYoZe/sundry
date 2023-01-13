// 編譯.proto文件
let pbjs = require('protobufjs/cli/pbjs');
let path = require('path');

pbjs.main([
  '--target', 'json', // 編譯為json
  '--out',path.resolve(__dirname, './index.json'), // 輸出文件
  path.resolve(__dirname, './user.proto') // 要編譯的文件
], function (err) {
  if (err) throw err;
})
