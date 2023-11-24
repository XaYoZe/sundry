import {
  _decorator,
  AnimationClip,
  Animation,
  Component,
  Enum,
  resources,
  SpriteFrame,
  CCString,
  CCFloat,
  CCBoolean,
  AssetManager,
} from "cc";
const { ccclass, property } = _decorator;

enum ctrl {
  start,
  loop,
  end,
  stop
}

enum status {
  PoorCondition, // 疾病
  Nomal, // 正常
  Happy, // 开心
  Ill, // 病
}

@ccclass('LoopPorperty')
class LoopPorperty {
  @property({displayName: '每秒帧数'})
  loopFps = 10;
  @property({displayName: '文件夹路径'})
  loopPath = '';
  @property({displayName: '结束后延迟'})
  sleep = 0;
}

@ccclass("BaseModel")
export class BaseModel extends Component {

  @property({ type: Enum(ctrl), tooltip: "动画阶段" })
  public ctrl = ctrl.start;
  // 角色状态
  @property({ type: Enum(status), tooltip: "动画控制" })
  public status = status.Nomal;

  // 开始动画
  startAnimaClip: AnimationClip = null;
  @property({ group: { name: "开始动作", id: "1" }, displayName: '每秒帧数' })
  startFPS = 10;
  @property({ group: { name: "开始动作", id: "1" }, displayName: '文件夹路径' })
  startPath = "";

  // 循环动画
  loopAnimaClip: Array<AnimationClip> = [];
  @property({ group: { name: "循环动作", id: "1" }, displayName: '顺序播放' })
  order = false;
  @property({ group: { name: "循环动作", id: "1" }, type: [LoopPorperty], displayName: '文件夹路径列表' })
  loopList:Array<LoopPorperty> = [];

  // 结束动作动画
  endAnimaClip: AnimationClip = null;
  @property({ group: { name: "结束动作", id: "1", }, displayName: '每秒帧数' })
  endFPS = 10;
  @property({ group: { name: "结束动作", id: "1" }, displayName: '文件夹路径' })
  endPath = "";

  // 加载完播放
  @property
  playOnLoad = true;

  // 结束加载动画
  loadClipEnd = false;

  // 当前动画状态
  currentPlayStatus:ctrl = ctrl.stop;

  // 动画组件
  animation: Animation = null;

  // 循环播放索引
  loopIndex = 0;
  
  start() {
   
  }
  initAnimation () {
    this.animation = this.node.addComponent(Animation);
    this.animation.on(Animation.EventType.FINISHED, (e) => {
      // console.log('播放开头结束', this.animation)
      switch (this.currentPlayStatus) {
        case ctrl.start:
          // console.log('播放开头结束')
          if (this.loopAnimaClip.length) {
            this.loopIndex = this.order ? 0 : Math.floor(Math.random() * this.loopAnimaClip.length);
            this.currentPlayStatus = ctrl.loop;
            this.animation.play('loop' + this.loopIndex);
          } else {
            this.currentPlayStatus = ctrl.end;
            this.animation.play('end')
          }
          break;
        case ctrl.loop:
          this.currentPlayStatus = ctrl.loop;
          this.loopIndex =  this.order ? (this.loopIndex + 1) % this.loopAnimaClip.length : Math.floor(Math.random() * this.loopAnimaClip.length);
          // console.log('继续播放循环', this.loopList[this.loopIndex].sleep, this.loopIndex);
          this.scheduleOnce(() => {
            this.animation.play('loop' + this.loopIndex);
          }, this.loopList[this.loopIndex].sleep / 1000)
          break;
        case ctrl.end:
          // console.log('播放结尾结束');
          this.currentPlayStatus = ctrl.stop;
        default:
          break;
      }
    })
    // 有开始动画
    if (this.startAnimaClip) {
      this.startAnimaClip.on(Animation.EventType.PLAY, (e) => {
      })
      this.animation.addClip(this.startAnimaClip, 'start');
    }
    // 有循环动画
    if (this.loopAnimaClip.length) {
      this.loopAnimaClip.forEach((clip, index)=> {
        this.animation.addClip(clip, 'loop' + index);
      })
    }
    // 有结束动画
    if (this.endAnimaClip) {
      this.animation.addClip(this.endAnimaClip, 'end');
    }
    // 加载完播放
    if (this.playOnLoad) {
      this.play()
    }
  }
  play () {
    if(this.startAnimaClip) {
      this.currentPlayStatus = ctrl.start;
      this.animation.play('start');
    } else if (this.loopAnimaClip.length) {
      // let index = Math.floor(Math.random() * this.loopAnimaClip.length);
      // console.log('继续播放循环', index);
      this.currentPlayStatus = ctrl.loop;
      this.animation.play('loop' + 0);
    } else if (this.endAnimaClip) {
      this.currentPlayStatus = ctrl.end;
      this.animation.play('end');
    }
    // setTimeout(() => {
    //   this.stop();
    // }, 5000)
    // this.update(0);
  }
  once (type, func) {
    
  }
  stop () {
    return new Promise((res, rej) => {
      // 有结束动画
      if (this.endAnimaClip) {
        this.currentPlayStatus = ctrl.end;
        this.animation.play('end')
        this.animation.once(Animation.EventType.FINISHED, ()=> {
          console.log('停止播放完成')
          res(true);
        });
      } else {
        res(false);
      }
    })
  }
  protected onLoad(): void {
    let loadList = [!!this.startPath, !!this.loopList.length, !!this.endPath];
    let clipLoad = new Proxy([false, false, false], {
      set: (_target, prop, value) => {
        _target[prop] = value;
        // console.log(_target, loadList);
        if (_target.every((item, index) => item === loadList[index])) {
          console.log("加载完成");
          this.loadClipEnd = true;
          this.initAnimation();
        }
        return value;
      },
    });
    // 开始动画
    if (this.startPath) {
      resources.loadDir(this.startPath, SpriteFrame, (err, assets) => {
        if (err) {
          console.error("startPath", err);
          return;
        }
        this.startAnimaClip =  AnimationClip.createWithSpriteFrames(assets, this.startFPS);
        // console.log("startPath", assets, this.startAnimaClip);
        clipLoad[0] = true;
      });
    }
    // 循环动画
    if (this.loopList.length) {
      let loadCount = 0;
      this.loopList.forEach((loopItem) => {
        if (loopItem.loopPath) {
          resources.loadDir(loopItem.loopPath, SpriteFrame, (err, assets) => {
            loadCount++;
            if (err) {
              console.error("loopList", err);
              return;
            }
            this.loopAnimaClip.push(
              AnimationClip.createWithSpriteFrames(assets, loopItem.loopFps)
            );
            // console.log("loopList", assets, this.loopAnimaClip);
            if (loadCount === this.loopList.length) {
              clipLoad[1] = true;
            }
          });
        } else {
          loadCount++;
          if (loadCount === this.loopList.length) {
            clipLoad[1] = true;
          }
        }
      });
    }
    // 结束动画
    if (this.endPath) {
      resources.loadDir(this.endPath, SpriteFrame, (err, assets) => {
        if (err) {
          // console.error("endPath", err);
          return;
        }
        // console.log("endPath", assets);
        this.endAnimaClip = AnimationClip.createWithSpriteFrames(assets,  this.endFPS);
        clipLoad[2] = true;
      });
    }
  }
  update(deltaTime: number) {}
}
