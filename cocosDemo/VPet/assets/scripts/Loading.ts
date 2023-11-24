import { _decorator, Component, Node, resources, director, Director, ProgressBar, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {
    async start() {
      try {
        await this.loadAssets();
        await this.loadScane();
        director.loadScene('main');
      } catch (err) {
        console.error('加載錯誤', err);
      }
    }
    // 設置標題
    setTitle (title) {
      this.node.getChildByName('title').getComponent(Label).string = title;
      this.setProgress(0, 1);
    }
    // 設置進度
    setProgress (count, total) {
      this.node.getChildByName('ProgressBar').getComponent(ProgressBar).progress = count / total;
      this.node.getChildByName('value').getComponent(Label).string = Math.floor(count / total * 100) + '%';
    }
    // 加載場景
    loadScane() {
      return new Promise(res => {
        this.setTitle('加載場景中...');
        director.preloadScene('main', (count, total) => {
          this.setProgress(count, total);
          if (count === total) {
            res(true)
          }
          console.log(count, total);
        }, (err, assets) => {
          console.log(err, assets);
        })
      })
    }
    // 加載資源
    loadAssets () {
      this.setTitle('加載資源中...');
      resources.preloadDir('vup', (count, total) => {
          this.setProgress(count, total);
        if (count === total) {
          director.loadScene('main');
        }
      }, (err, assets) => {
        
      })
    }
    update(deltaTime: number) {
        
    }
}


