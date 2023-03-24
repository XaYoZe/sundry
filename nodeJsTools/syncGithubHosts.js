// windows同步线上hosts到本地hosts
// 线上hosts网址 https://raw.hellogithub.com/hosts
const fs = require("fs"),
  https = require("https");

const netHostsPath = 'https://raw.hellogithub.com/hosts';
const localHostsPath = 'C:/Windows/System32/drivers/etc/hosts';

// 获取线上hosts
function getNetHosts() {
  return new Promise((resolve, reject) => {
    https.get(netHostsPath, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
      res.on("error", (err) => {
        reject(err);
        throw err;
      });
    });
  });
}

(async function () {
  // 读取本地hosts
  let hostsFile = fs.readFileSync(localHostsPath, {
    encoding: "utf-8",
  });
  let hostsNet = await getNetHosts(); // fs.readFileSync('./hosts', {encoding: 'utf-8'});

  // 所有的域名
  let originList = [];
  let reg = /(?:^\s+|^[^#])([0-9\.]+)\s+([^#\s]*)/gm;
  let hostsNetArr = hostsNet.trim().split(/\r\n|\n/);
  hostsNetArr.forEach((item) => {
    let match = item.match(reg);
    match && originList.push(match[0]);
  });

  // 线上hosts文件开始和结束标识
  let hostsNetStart = hostsNetArr[0]; //'# GitHub520 Host Start';
  let hostsNetEnd = hostsNetArr[hostsNetArr.length - 1]; //'# GitHub520 Host End';
  let hostsFileArr = hostsFile.trim().split(/\r\n|\n/);
  let removeRow = false;
  // 过滤所有旧的域名
  hostsFileArr = hostsFileArr.filter((row, index) => {
    let flag = true;
    row = row.trim();
    // 开始删除
    if (row === hostsNetStart) {
      removeRow = true;
    }
    // 结束删除
    if (row === hostsNetEnd && removeRow) {
      removeRow = false;
      flag = false;
    }
    // 删除行
    if (removeRow) {
      flag = false;
    }
    // 过滤重复的域名
    if (originList.some((origin) => new RegExp(origin + "$").test(row))) {
      flag = false;
    }
    return flag;
  });
  
  try {
    fs.writeFileSync(
      "C:/Windows/System32/drivers/etc/hosts",
      hostsFileArr.concat(hostsNetArr).join("\r\n"),
      { flag: "w+" }
    );
    console.log('更新成功')
    console.log('----------------')
    console.log(hostsNet)
    console.log('----------------')
  } catch (err) {
    throw err
  }
})();
