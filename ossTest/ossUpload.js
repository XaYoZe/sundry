// 實現oss同步本地, md5校驗文件
// 使用
// node .\ossSync.js basePath=F:\Test ossPath=resource targetPath=images type=0
// 說明: 將本地路徑F:\Test下的images文件夾同步到OSS上的resource的images下
// 參數
// basePath: 本地路徑
// ossPath: oss路徑
// targetPath: 目標文件夾
// mode: 0新增修改删除, 1新增修改不删除, 2全覆盖不删除
let OSS = require("ali-oss");
let crypto = require("crypto");
let path = require("path");
let fs = require("fs");

// 環境變量
function getParams () {
  let params = {};
  process.argv.forEach((item) => {
    let [key, value] = item.split("=");
    if (value) {
      params[key] = value;
    }
  });
  return params;
}

let { ossPath, basePath, targetPath = "", mode = 0, region,accessKeyId,accessKeySecret,bucket, debug = '0'} = getParams();

let ossConfig = {
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hongk。
  region,
  // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
  accessKeyId,
  accessKeySecret,
  // yourbucketname填写存储空间名称。
  bucket
};

if (!ossPath || !basePath || !targetPath) {
  throw "缺少參數";
}

class UploadFile {
  /**
   * @param {object} option  basePath: 本地路徑;ossPath: oss路徑;targetPath: 目標文件夾;mode: 上传方式0新增修改删除, 1新增修改不删除, 2全覆盖不删除
   */
  constructor(options) {
    this.fileList = {}; // status:0無操作,1添加,2更新,3刪除
    this.basePath = options.basePath; // 本地路徑
    this.ossPath = options.ossPath; // 線上路徑
    this.targetPath = options.targetPath || ""; // 文件路徑
    this.mode = options.mode; // 上传类型
    this.delelteFileList = {}; // 刪除列表
    this.editFileList = []; // 修改列表
    this.addFileList = []; // 新增列表
    this.allFile = [];
    this.debug = Number(options.debug);
    // oss配置
    this.client = new OSS(options.ossConfig);
    this.startUpload ();
  }
  // 獲取所有文件
  async getAllFileList(filePath) {
    try {
      let dir = fs.readdirSync(path.join(this.basePath, filePath), {
        withFileTypes: true,
      });
      for (let index = 0; index < dir.length; index++) {
        let fileInfo = dir[index];
        // 文件
        if (fileInfo.isFile()) {
          this.allFile.push(path.join(filePath, fileInfo.name));
        } else if (fileInfo.isDirectory()) {
          this.getAllFileList(path.join(filePath, fileInfo.name));
        }
      }
    } catch (err) {
      // console.log('获取文件目录失败', err);
      throw '获取文件目录失败:' + err;
    }
  }
  // 檢查文件
  checkFileList(ossFileObject) {
    return new Promise((resolve) => {
      let totalCount = this.allFile.length;
      let count = new Proxy(
        { value: 0 },
        {
          set: function (obj, prop, val) {
            if (val === totalCount) {
              console.log("加載完成");
              resolve();
            }
            obj[prop] = val;
            return true;
          },
        }
      );
      this.allFile.forEach(async (filePach) => {
        // 讀取文件
        let ossSrc = this.toOssPath(path.join(this.ossPath, filePach));
        let ossFile = ossFileObject[ossSrc];
        if (this.delelteFileList[ossSrc]) {
          // 从删除列表移除本地有的文件
          delete this.delelteFileList[ossSrc];
        }
        this.readFile(filePach).then(async (localFile) => {
          //  全覆盖模式不校验md5
          // console.log(ossFile && this.mode != 2);
          if (ossFile && this.mode != 2) {
            this.debug && console.log('md5 etag對比相同:', JSON.stringify(localFile.md5) === ossFile.etag.toLocaleLowerCase(), ossFile.name)
            // 通过put接口上传的文件md5和etag相同, 過濾掉檢查md5和etag相同
            if (
              JSON.stringify(localFile.md5) !== ossFile.etag.toLocaleLowerCase()
            ) {
              try {
                // 獲取oss文件信息
                let head = await this.client.head(ossFile.name);
                // console.log('文件一樣', head);
                if (head.status === 200 && head.res.status === 200) {
                  this.debug && console.log('md5Hax對比相同:', head.res.headers["content-md5"] === localFile.md5Hax, ossFile.name);
                  if (head.res.headers["content-md5"] === localFile.md5Hax) {
                    // console.log("重複文件", head.res.headers["content-md5"], localFile.md5Hax);
                    count.value++;
                    return;
                  }
                  this.debug && console.log('md5Hax對比不同', 'oss:', head.res, '本地:', localFile);
                  // 改动的文件
                  this.editFileList.push(localFile);
                } else {
                  console.log("獲取oss文件信息", head);
                }
              } catch (err) {
                console.log("獲取OSS文件信息錯誤", err);
              }
            }
          } else {
            // 新增的文件
            this.addFileList.push(localFile);
          }
          count.value++;
        });
      });
    });
  }
  // 過濾篩選文件
  async startUpload () {
      let ossFileObject = {};
      // 獲取oss列表數據
      let objects = await this.getOssFileList();
      console.log("加載oss列表");
      for (let i = 0; i < objects.length; i++) {
        let fileInfo = objects[i];
        // 去掉文件夾
        if (!/\/$/.test(fileInfo.name)) {
          ossFileObject[fileInfo.name] = fileInfo;
          // 只有mode为0或2时才加入到删除列表 
          if (this.mode == 0 || this.mode == 2) {
            // 添加到删除列表
            this.delelteFileList[fileInfo.name] = true;
          }
        }
      }
      this.debug && fs.writeFileSync("./ossListRes.json", JSON.stringify(objects));
      // 獲取所有文件列表
      await this.getAllFileList(this.targetPath);
      this.debug && fs.writeFileSync("./allFileList.json", JSON.stringify(this.allFile));
      // 檢查文件相同修改和新增
      console.log("筛选文件");
      await this.checkFileList(ossFileObject);
      // 上傳
      await this.upload();
      console.log("完成");
  }
  // 獲取oss列表數據
  async getOssFileList() {
    try {
      let continuationToken = null;
      let maxKeys = 1000;
      let totalList = [];
      do {
        const result = await this.client.listV2({
          prefix: this.toOssPath(path.join(this.ossPath, this.targetPath)),
          "continuation-token": continuationToken,
          "max-keys": maxKeys,
        });
        continuationToken = result.nextContinuationToken;
        totalList = totalList.concat(result.objects);
      } while (continuationToken);
      return totalList;
    } catch(err) {
      throw '获取oss文件列表失败' + err;
    }
  }
  // 讀取文件信息
  readFile(filePath) {
    return new Promise((res) => {
      let stream = fs.createReadStream(path.join(this.basePath, filePath));
      let md5 = crypto.createHash("md5");
      let chunks = [];
      let size = 0;
      // console.log(stream);
      stream.on("data", (chunk) => {
        // console.log(chunk.length)
        chunks.push(chunk);
        md5.update(chunk, "binary");
        size += chunk.length;
      });
      stream.on("end", (e) => {
        let u8a = md5.digest();
        let str = "";
        let md5Str = "";
        u8a.forEach(
          (item) => {
            str += String.fromCharCode(item);
            md5Str += item.toString(16).padStart(2,0);
          }
        );
        res({
          path: filePath,
          md5: md5Str,
          md5Hax: btoa(str),
          data: Buffer.concat(chunks, size),
        });
      });
    });
  }
  // 上傳
  async upload() {
    return new Promise((resolve) => {
      let delelteFileList = Object.keys(this.delelteFileList);
      let totalCount =
        this.editFileList.length +
        this.addFileList.length +
        delelteFileList.length;
      let successCount = 0;
      if (totalCount === 0) {
        console.log("无文件改动");
        resolve();
        return;
      }
      this.debug && console.log('詳細列表見目錄下json');
      console.log("刪除文件:", delelteFileList.length);
      console.log("修改文件:", this.editFileList.length);
      console.log("新增文件:", this.addFileList.length);
      console.log("總文件数:", totalCount);
      this.debug && fs.writeFileSync("./del.json", JSON.stringify(delelteFileList));
      this.debug && fs.writeFileSync("./edit.json", JSON.stringify(this.editFileList.map(item => item.path)));
      this.debug && fs.writeFileSync("./add.json", JSON.stringify(this.addFileList.map(item => item.path)));
      console.log("开始上传");
      // 刪除oss上本地沒有的文件
      delelteFileList.forEach((fileName) => {
        this.client
          .delete(fileName)
          .then((res) => {
            successCount++;
            totalCount === successCount && resolve();
            console.log("刪除成功", fileName);
          })
          .catch((err) => {
            totalCount--;
            console.log("刪除失敗", fileName, err);
            throw '刪除失敗'
          });
      });
      // 上傳修改的的文件
      this.editFileList.forEach((item) => {
        this.client
          .put(this.toOssPath(path.join(this.ossPath, item.path)), item.data, {
            headers: {
              "Content-MD5": item.md5Hax, // md5一致校驗, 試了沒用...
            },
          })
          .then((res) => {
            successCount++;
            totalCount === successCount && resolve();
            console.log("上傳成功", item.path);
          })
          .catch((err) => {
            totalCount--;
            console.log("上傳失敗", item.path, err);
            throw '上傳失敗'
          });
      });
      // 上傳新增的文件
      this.addFileList.forEach((item) => {
        this.client
          .put(this.toOssPath(path.join(this.ossPath, item.path)), item.data, {
            headers: {
              "Content-MD5": item.md5Hax, // md5一致校驗, 試了沒用...
            },
          })
          .then((res) => {
            successCount++;
            totalCount === successCount && resolve();
            console.log("新增成功", item.path);
          })
          .catch((err) => {
            totalCount--;
            console.log("新增失敗", item.path, err);
            throw '新增失敗'
          });
      });
    });
  }
  // 轉\\為/
  toOssPath(localPath) {
    return localPath.replace(/\\/g, "/");
  }
}

new UploadFile({
  basePath,
  ossPath,
  targetPath,
  mode,
  ossConfig,
  debug
});
