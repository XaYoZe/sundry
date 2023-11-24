import {
  _decorator,
  AnimationClip,
  Animation,
  animation,
  Component,
  Enum,
  resources,
  SpriteFrame,
  CCString,
} from "cc";
const { ccclass, property, executeInEditMode, uniquelyReferenced } = _decorator;


// 自定义动画接口
@ccclass("FramePathObj")
class FramePathObj {
  @property({ displayName: "顺序播放" })
  order: boolean = false;
  @property({ displayName: "開始動作" })
  start: string = "";
  @property({ displayName: "循環動作", type: [CCString] })
  loop: string[] = [];
  @property({ displayName: "結束動作" })
  end: string = "";
}

// 播放状态
enum PlayStatus {
  Stop,
  Start,
  Loop,
  End,
}

// 角色状态
enum CharaterStatus {
  Happy = 1,
  Normal,
  PoorCondition,
  Ill,
}

// 状态动画
interface StatusClip {
  [PlayStatus.Start]?: AnimationClip;
  [PlayStatus.Loop]?: AnimationClip[];
  [PlayStatus.End]?: AnimationClip;
}

// 动画缓存
type AnimaClipCache = {
  [key in CharaterStatus]: StatusClip;
};

@ccclass("CharaterControl")
// @executeInEditMode
export class CharaterControl extends Component {
  // 加载完播放
  @property
  playOnLoad = true;
  // 動畫路徑配置
  @property({ group: "動畫", type: FramePathObj, displayName: "開心" })
  animaPathHappy: FramePathObj = new FramePathObj();
  @property({ group: "動畫", type: FramePathObj, displayName: "正常" })
  animaPathNomal: FramePathObj = new FramePathObj();
  @property({ group: "動畫", type: FramePathObj, displayName: "低落" })
  animaPathPoorCondition: FramePathObj = new FramePathObj();
  @property({ group: "動畫", type: FramePathObj, displayName: "生病" })
  animaPathIll: FramePathObj = new FramePathObj();

  // 保存動畫路徑配置
  get animaPaths(): { [key in CharaterStatus]: FramePathObj } {
    return {
      [CharaterStatus.Happy]: this.animaPathHappy,
      [CharaterStatus.Normal]: this.animaPathNomal,
      [CharaterStatus.PoorCondition]: this.animaPathPoorCondition,
      [CharaterStatus.Ill]: this.animaPathIll,
    };
  }

  @property({ type: Enum(CharaterStatus), tooltip: "动画控制" })
  public status = CharaterStatus.Normal;

  // 當前選中狀態
  get currentPath(): FramePathObj {
    return this.animaPaths[this.status];
  }

  // 动画clip缓存
  animaClipCache: AnimaClipCache = {
    [CharaterStatus.Happy]: {},
    [CharaterStatus.Normal]: {},
    [CharaterStatus.PoorCondition]: {},
    [CharaterStatus.Ill]: {},
  };
  // 当前动画clip
  get currentAnimaClip(): StatusClip {
    return this.animaClipCache[this.status];
  }

  loadClipEndObj = {
    [CharaterStatus.Happy]: false,
    [CharaterStatus.Normal]: false,
    [CharaterStatus.PoorCondition]: false,
    [CharaterStatus.Ill]: false,
  };
  // 结束加载动画
  get loadClipEnd () {
    return this.loadClipEndObj[this.status];
  };

  // 当前动画状态
  currentPlayStatus: PlayStatus = PlayStatus.Start;

  // 动画组件
  animation: Animation = null;

  // 循环播放索引
  loopIndex = 0;

  // 播放動畫
  play(status) {
    this.status = status;
    if (this.currentAnimaClip[PlayStatus.Start]) {
      this.currentPlayStatus = PlayStatus.Start;
      this.animation.play(`${status}_start`);
    } else if (this.currentAnimaClip[PlayStatus.Loop]) {
      // let index = Math.floor(Math.random() * this.loopAnimaClip.length);
      // console.log('继续播放循环', index);
      this.currentPlayStatus = PlayStatus.Loop;
      this.animation.play(`${status}_loop_0`);
    } else if (this.currentAnimaClip[PlayStatus.End]) {
      this.currentPlayStatus = PlayStatus.End;
      this.animation.play(`${status}_end`);
    }
  }
  // 停止播放
  stop() {
    return new Promise((res, rej) => {
      // 有结束动画
      if (this.currentAnimaClip[PlayStatus.End]) {
        this.currentPlayStatus = PlayStatus.End;
        this.animation.play(`${this.status}_end`);
        this.animation.once(Animation.EventType.FINISHED, () => {
          console.log("停止播放完成");
          res(true);
        });
      } else {
        res(false);
      }
    });
  }

  // 加載資源
  loadAnimaAssets(loadStatus: CharaterStatus) {
    if (this.loadClipEndObj[loadStatus]) return Promise.resolve(true);
    return new Promise((res, rej) => {
      let usePath = this.animaPaths[loadStatus];
      let useClip = this.animaClipCache[loadStatus];
      let loadList = [!!usePath.start, !!usePath.loop.length, !!usePath.end];
      let clipLoad = new Proxy([false, false, false], {
        set: (_target, prop, value) => {
          _target[prop] = value;
          // console.log(_target, loadList);
          if (_target.every((item, index) => item === loadList[index])) {
            console.log("加载完成");
            this.loadClipEndObj[loadStatus] = true;
            res(true);
          }
          return value;
        },
      });
      // 开始动画
      if (usePath.start) {
        // 有緩存
        if (useClip[PlayStatus.Start]) {
          clipLoad[0] = true;
          return;
        }
        resources.loadDir(usePath.start, SpriteFrame, (err, assets) => {
          if (err || assets.length === 0) {
            console.error(
              "startPath",
              "确认资源路径是否正确",
              usePath.start,
              err
            );
            return;
          }
          useClip[PlayStatus.Start] = this.createAnimationClip(assets);
          clipLoad[0] = true;
        });
      }
      // 循环动画
      if (usePath.loop.length) {
        if (useClip[PlayStatus.Loop]?.length) {
          clipLoad[1] = true;
          return;
        }
        let loadCount = 0;
        useClip[PlayStatus.Loop] = [];
        usePath.loop.forEach((loopItem, index) => {
          if (loopItem) {
            console.time("加載動畫" + index);
            resources.loadDir(loopItem, SpriteFrame, (err, assets) => {
              loadCount++;
              if (err || assets.length === 0) {
                console.error(
                  "loopList",
                  "确认资源路径是否正确",
                  loopItem,
                  err,
                  assets
                );
                return;
              }
              useClip[PlayStatus.Loop][index] =
                this.createAnimationClip(assets);
              console.timeEnd("加載動畫" + index);
              console.log(loopItem, assets);
              console.log(this.animaClipCache);
              if (loadCount === usePath.loop.length) {
                clipLoad[1] = true;
              }
            });
          } else {
            loadCount++;
            if (loadCount === usePath.loop.length) {
              clipLoad[1] = true;
            }
          }
        });
      }
      // 结束动画
      if (usePath.end) {
        // 有緩存
        if (useClip[PlayStatus.End]) {
          clipLoad[2] = true;
          return;
        }
        resources.loadDir(usePath.end, SpriteFrame, (err, assets) => {
          if (err || assets.length === 0) {
            console.error(
              "loopList",
              "确认资源路径是否正确",
              this.currentPath.end,
              err
            );
            return;
          }
          useClip[PlayStatus.End] = this.createAnimationClip(assets);
          clipLoad[2] = true;
        });
      }
      console.log(this.status);
    });
  }
  
  //初始化動畫
  initAnimation(loadStatus: CharaterStatus) {
    this.animation = this.node.getComponent(Animation);
    if (!this.animation) {
      // 創建動畫組件;
      this.animation = this.node.addComponent(Animation)
      this.animation.on(Animation.EventType.FINISHED, (e) => {
        // console.log('播放开头结束', this.animation)
        switch (this.currentPlayStatus) {
          case PlayStatus.Start:
            // console.log('播放开头结束')
            if (this.currentAnimaClip[PlayStatus.Loop]?.length) {
              this.loopIndex = this.currentPath.order
                ? 0
                : Math.floor(
                    Math.random() * this.currentAnimaClip[PlayStatus.Loop].length
                  );
              this.currentPlayStatus = PlayStatus.Loop;
              this.animation.play(`${this.status}_loop_${this.loopIndex}`);
            } else {
              this.currentPlayStatus = PlayStatus.End;
              this.animation.play(`${this.status}_end`);
            }
            break;
          case PlayStatus.Loop:
            this.currentPlayStatus = PlayStatus.Loop;
            this.loopIndex = this.currentPath.order
              ? (this.loopIndex + 1) %
                this.currentAnimaClip[PlayStatus.Loop].length
              : Math.floor(
                  Math.random() * this.currentAnimaClip[PlayStatus.Loop].length
                );
            // console.log('继续播放循环', this.loopList[this.loopIndex].sleep, this.loopIndex);
              this.animation.play(`${this.status}_loop_${this.loopIndex}`);
            break;
          case PlayStatus.End:
            // console.log('播放结尾结束');
            this.currentPlayStatus = PlayStatus.Stop;
          default:
            break;
        }
      });
    }
    // 添加開始动画
    if (this.animaClipCache[loadStatus][PlayStatus.Start]) {
      this.animation.addClip(this.animaClipCache[loadStatus][PlayStatus.Start], `${loadStatus}_start`);
    }
    // 添加循環动画
    if (this.animaClipCache[loadStatus][PlayStatus.Loop]?.length) {
      this.animaClipCache[loadStatus][PlayStatus.Loop].forEach((clip, index) => {
        this.animation.addClip(clip, `${loadStatus}_loop_${index}`);
      });
    }
    // 添加结束动画
    if (this.animaClipCache[loadStatus][PlayStatus.End]) {
      this.animation.addClip(this.animaClipCache[loadStatus][PlayStatus.End], `${loadStatus}_end`);
    }
  }
  protected async onLoad(): Promise<void> {
    await this.loadAnimaAssets(this.status);
    await this.initAnimation(this.status);
    // 加载完播放
    if (this.playOnLoad) {
      console.log("加载完播放", this.animation);
      this.play(this.status);
    }
  }
  /**
   * @description  创建动画片段，對圖片命名有格式要求，名字_索引_持續時間
   *  */
  createAnimationClip(assets): AnimationClip {
    let frameList: { time: number; frame: SpriteFrame }[] = [];
    let totalTime = 0;
    let clipName = "";
    // 排序
    assets.forEach((item) => {
      let [name, index, duration] = item.name.split("_");
      frameList[Number(index)] = { time: totalTime, frame: item };
      totalTime += Number(duration) / 1000;
      clipName = name;
    });

    const clip = new AnimationClip(clipName);
    clip.sample = totalTime / frameList.length;
    clip.duration = totalTime;
    const track = new animation.ObjectTrack();
    track.path = new animation.TrackPath()
      .toComponent("cc.Sprite")
      .toProperty("spriteFrame");
    const curve = track.channels()[0].curve;
    curve.assignSorted(frameList.map((item, index) => [item.time, item.frame]));
    clip.addTrack(track);
    return clip;
  }
  // 狀態改變
  async changeStatus(event, status: CharaterStatus) {
    console.log('切換動作', CharaterStatus[status], status);
    // 加載資源
    await this.loadAnimaAssets(status);
    await this.initAnimation(status);
    this.stop().then(res => {
      this.play(status);
    })

    // if (this.currentPlayStatus) {
    //   this.status[this.currentPlayStatus].active = false;
    //   this.status[this.currentPlayStatus].stop().then(res => {
    //     console.log('切换动作');
    //     // this.currentPlayStatus = statusList[Math.floor(Math.random() * 4)]
    //     this.status[this.currentPlayStatus].active = true;
    //     this.status[this.currentPlayStatus].play();
    //   });
    //   return
    // }
    // this.curPlayStatus = statusList[Math.floor(Math.random() * 4)]
    // this.status[this.curPlayStatus].active = true;
    // this.status[this.curPlayStatus].getComponent(BaseModel).play();
    // this.curPlayStatus = data;
  }
  update(deltaTime: number) {}
}
