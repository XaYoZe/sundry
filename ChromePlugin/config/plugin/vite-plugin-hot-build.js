import childProcess from 'child_process';
import path from 'path';

export default function hotBuild() {
  let excludeList = ['dist'].map(item => path.resolve(item));
  let debound = null;
  let time = 500;
  return {
    name: 'hot-build',
    apply: 'serve', // 運行環境
    handleHotUpdate (HmrContext) { // 熱更新觸發
      let file = path.resolve(HmrContext.file);
      // 過濾目錄
      if (excludeList.filter(item => file.startsWith(item)).length) {
        return
      }
      clearTimeout(debound);
      debound = setTimeout(() => {
        childProcess.exec('yarn build', (err, stdout, stderr) => {
          console.log(err, stdout, stderr)
        })
      }, time)
    }
  }
}