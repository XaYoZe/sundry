// 递归删除空文件夹
const fs = require("fs");
const path = require("path");
const readline = require('readline');

// 检查空文件夹
function checkNulldDir(target, list = []) {
  let dir = fs.readdirSync(target, { withFileTypes: true });
  dir.forEach((item) => {
    if (item.isDirectory()) {
      checkNulldDir(path.join(target, item.name), list);
    }
  });
  if (!dir.length) {
    list.push(target);
  }
  return list;
}

// 递归删除
function delNullDir (deletePath, count = 0) {
  let list = checkNulldDir(deletePath);
  if (list.length) {
    list.forEach(dirPath => {
      fs.rmdirSync(dirPath);
      count++
      console.log(`删除: ${dirPath}`);
    })
    delNullDir(deletePath, count)
  } else {
    console.log('删除完成')
    console.log('删除空文件夹数量：', count);
  }
}

async function start  () {
  let rl = readline.createInterface({input: process.stdin, output: process.stdout})
  rl.question('输入要删除空文件的目录，默认当前目录', (deletePath) => {
    console.log(`目录：${deletePath}`);
    if (!deletePath || fs.existsSync(deletePath)) {
        delNullDir(deletePath || './')
        rl.close()
    } else {
      throw '文件夹路径错误'
    }
  });
  
}
start();