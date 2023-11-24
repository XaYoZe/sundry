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
  Node,
  utils,
  Sprite,
  UITransform,
} from "cc";
const { ccclass, property, executeInEditMode, uniquelyReferenced } = _decorator;

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
  [PlayStatus.Start]?: [AnimationClip, AnimationClip];
  [PlayStatus.Loop]?: [AnimationClip[], AnimationClip[]];
  [PlayStatus.End]?: [AnimationClip, AnimationClip];
}

// 动画缓存
type AnimaClipCache = {
  [key in CharaterStatus]: StatusClip;
};

// 自定义动画接口
@ccclass("FramePathObj2")
class FramePathObj2 {
  // @property({ displayName: "多層動畫" })
  insert: boolean = false;
  @property({ displayName: "顺序播放" })
  order: boolean = false;
  @property({ displayName: "開始動作" })
  start: string = "";
  @property({ displayName: "循環動作", type: [CCString] })
  loop: string[] = [];
  @property({ displayName: "結束動作" })
  end: string = "";
  @property({
    group: { name: "遮罩動畫" },
    displayName: "開始",
    visible() {
      this.frontStart || (this.frontStart = this.start);
      return this.insert ? true : false;
    },
  })
  frontStart: string = "";
  @property({
    group: { name: "遮罩動畫" },
    displayName: "循環",
    type: [CCString],
    visible() {
      this.frontLoop.length ||
        (this.frontLoop = JSON.parse(JSON.stringify(this.loop)));
      return this.insert ? true : false;
    },
  })
  frontLoop: string[] = [];
  @property({
    group: { name: "遮罩動畫" },
    displayName: "結束",
    visible() {
      this.frontEnd || (this.frontEnd = this.end);
      return this.insert ? true : false;
    },
  })
  frontEnd: string = "";
}

@ccclass("AnimaModel2")
@executeInEditMode
export class AnimaModel2 extends Component {
  // 正面
  frontNode: Node;
  // 中間
  insertNode: Node;
  // 後面
  backNode: Node;

  // 加载完播放
  @property
  playOnLoad = true;

  @property({ type: Enum(CharaterStatus), tooltip: "动画控制" })
  public status = CharaterStatus.Normal;

  @property({ group: "動畫", displayName: "夾層" })
  insert: boolean = false;
  // 動畫路徑配置
  @property({
    group: "動畫",
    type: FramePathObj2,
    displayName: "通用",
    visible() {
      return this.insert;
    },
  })
  commonFront: FramePathObj2 = new FramePathObj2();
  @property({
    group: "動畫",
    type: FramePathObj2,
    displayName: "開心",
    visible() {
      this.animaPathHappy.insert = this.insert;
      return true;
    },
  })
  animaPathHappy: FramePathObj2 = new FramePathObj2();

  @property({
    group: "動畫",
    type: FramePathObj2,
    displayName: "正常",
    visible() {
      this.animaPathNomal.insert = this.insert;
      return true;
    },
  })
  animaPathNomal: FramePathObj2 = new FramePathObj2();

  @property({
    group: "動畫",
    type: FramePathObj2,
    displayName: "低落",
    visible() {
      this.animaPathPoorCondition.insert = this.insert;
      return true;
    },
  })
  animaPathPoorCondition: FramePathObj2 = new FramePathObj2();

  @property({
    group: "動畫",
    type: FramePathObj2,
    displayName: "生病",
    visible() {
      this.animaPathIll.insert = this.insert;
      return true;
    },
  })
  animaPathIll: FramePathObj2 = new FramePathObj2();

  loadClipEndObj = {
    [CharaterStatus.Happy]: false,
    [CharaterStatus.Normal]: false,
    [CharaterStatus.PoorCondition]: false,
    [CharaterStatus.Ill]: false,
  };

  // 保存動畫路徑配置
  get animaPaths(): { [key in CharaterStatus]: FramePathObj2 } {
    return {
      [CharaterStatus.Happy]: this.animaPathHappy,
      [CharaterStatus.Normal]: this.animaPathNomal,
      [CharaterStatus.PoorCondition]: this.animaPathPoorCondition,
      [CharaterStatus.Ill]: this.animaPathIll,
    };
  }
  
  
  // 动画clip缓存
  animaClipCache: AnimaClipCache = {
    [CharaterStatus.Happy]: {},
    [CharaterStatus.Normal]: {},
    [CharaterStatus.PoorCondition]: {},
    [CharaterStatus.Ill]: {},
  };

  // 當前選中狀態
  get currentPath(): FramePathObj2 {
    return this.animaPaths[this.status];
  }

  protected onLoad(): void {
    this.initNode();
  }
  start() {}
  initNode() {
    this.frontNode = this.node.getChildByName("front") || new Node("front");
    this.insertNode = this.node.getChildByName("insert") || new Node("insert");
    this.backNode = this.node.getChildByName("back") || new Node("back");
    [this.frontNode, this.insertNode, this.backNode].forEach((node) => {
      console.log(node);
      let ui = node.getComponent(UITransform) || node.addComponent(UITransform);
      ui.setContentSize(1000, 1000);
      ui.setAnchorPoint(0.5, 0.5);

      let sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
      sprite.trim = false;
      sprite.type = Sprite.Type.SIMPLE;
      console.log(
        node.name,
        node.getComponent(UITransform),
        node.getComponent(Sprite)
      );

      let animation = this.node.getComponent(Animation)  || node.addComponent(Animation);
      animation.on(Animation.EventType.FINISHED, (e) => {
        console.log('播放结束', animation)
      })
    });
  }

  
  // 加載資源
  loadAnimaAssets(loadStatus: CharaterStatus) {
    if (this.loadClipEndObj[loadStatus]) return Promise.resolve(true);
    return new Promise((res, rej) => {
      let totalLoadNum = 0;
      let currentLoadNum = 0;
      let usePath = this.animaPaths[loadStatus];
      let useClip = this.animaClipCache[loadStatus];
      let loadCount = new Proxy({total: 0, current: 0}, {
        set (_target, prop, value) {
          _target[prop] = value;
          if (_target[prop] === _target.current) {
            this.loadClipEndObj[loadStatus] = true;
            res(true);
          }
          return value
        }
      })
      // let loadList = [!!usePath.start, !!usePath.loop.length, !!usePath.end];
      // let clipLoad = new Proxy([false, false, false], {
      //   set: (_target, prop, value) => {
      //     _target[prop] = value;
      //     // console.log(_target, loadList);
      //     if (_target.every((item, index) => item === loadList[index])) {
      //       console.log("加载完成");
      //       this.loadClipEndObj[loadStatus] = true;
      //       res(true);
      //     }
      //     return value;
      //   },
      // });
      // 开始动画
      if (usePath.start) {
        // 有緩存
        if (!useClip[PlayStatus.Start]) {
          loadCount.total += usePath.insert ? 2 : 1;
          [usePath.start].concat(usePath.insert ? [usePath.frontStart] : []).forEach((aniamPath, index) => {
            resources.loadDir(aniamPath, SpriteFrame, (err, assets) => {
              if (err || assets.length === 0) {
                console.error(
                  "startPath",
                  "确认资源路径是否正确",
                  aniamPath,
                  err
                );
                return;
              }
              useClip[PlayStatus.Start][index] = this.createAnimationClip(assets);
              loadCount.current++;
            });
          })

          // loadCount.total += usePath.insert ? 2 : 1;
          // clipLoad[0] = true;
        }
      }
      // 循环动画
      if (usePath.loop.length) {
        if (!useClip[PlayStatus.Loop]?.length) {
          // clipLoad[1] = true;
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
      if (usePath.insert) {

      }
      console.log(this.status);
    });
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
  // loadAnimaAssets () {
  //   return new Promise((res, rej) => {
  //     [
  //       this.animaPathHappy,
  //       this.animaPathNomal,
  //       this.animaPathPoorCondition,
  //       this.animaPathIll
  //     ].forEach(pathConfig => {
  //       pathConfig.

  //     })
  //   })

  // }

  update(deltaTime: number) {}
}
