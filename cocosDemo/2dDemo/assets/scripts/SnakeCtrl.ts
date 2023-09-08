import {
  _decorator,
  Component,
  instantiate,
  Node,
  Vec3,
  UITransform,
  PhysicsSystem2D,
  Sprite,
  Contact2DType,
  systemEvent,
  SystemEvent,
  View,
  Rect,
  SpriteFrame,
  director,
  assetManager,
  Color,
  PhysicsSystem,
  Size,
  RigidBody2D,
  CircleCollider2D,
  Collider2D,
  Vec2,
  tween,
  NodePool,
  Camera
} from "cc";
const { ccclass, property } = _decorator;
import { FoodCreat } from "./FoodCreat";

// 按键code
enum CtrlKey {
  null = 0,
  up = 38,
  down = 40,
  left = 37,
  right = 39,
  space = 32
}

// 碰撞矩阵分组
enum group {
  food = 1 << 1,
  snake = 1 << 2,
  wall = 1 << 3,
  bullet = 1 << 4
}

/**
 * @param node 子弹节点
 * @param speed 子弹速度
 * @param coor 子弹坐标
 */
interface bulletData {
  node: Node,
  speed: Vec3,
  coor: Vec3,
  enabled: boolean
}

@ccclass("SnakeCtrl")
export class SnakeCtrl extends Component {
  // [1]
  //
  @property({ type: Sprite })
  public snakePrfb: Sprite | null = null;

  @property({ type: FoodCreat })
  private foodCreat: FoodCreat | null;
  // 当前按鈕方向
  private curDir: CtrlKey;
  // 當前坐標
  private curPos: Vec3 = new Vec3();
  private _deltaPos: Vec3 = new Vec3(0, 0, 0);
  private _curRunSpeed: number = 50;
  private _jumpTime: number = 1;

  gameOver:boolean = false;

  // 初始速度
  @property
  private defaultSpeed: number = 100;

  // 速度递增
  @property
  private addSpeedStep: number = 100;

  // 最大速度
  @property
  private maxSpeed: number = 500;

  // 额外速度
  private speed: number = 0;

  // 可视窗口大小
  private view: View = new View();
  private frameSize = this.view.getFrameSize();
  private canvasSize = this.view.getCanvasSize();

  // 蛇头节点
  public snakeHead: Node;
  // 蛇身节点
  public snakeBodyList: Array<Node> = [];
  // 保存蛇身坐标
  public snakeBodyRoute: Array<any> = [];
  // 保存蛇身节点方向
  // public snakeBodyDirection: Array<CtrlKey> = [];
  // public snakeBodyDirectionMapping: object = {
  //   [CtrlKey.up]: new Vec3(0, -10, 0),
  //   [CtrlKey.down]: new Vec3(0, 10, 0),
  //   [CtrlKey.right]: new Vec3(-10, 0, 0),
  //   [CtrlKey.left]: new Vec3(10, 0, 0),
  // };
  bulletNode: Node;
  bulletIndex: number = 0;
  bulletList:Array<bulletData> = [];
  bulletIdleList: Array<number> = [];
  bulletCache:{[key:number]: bulletData } = {};
  bulletNodePool: NodePool = new NodePool('bulletNodePool')

  get snakeHeadNode() {
    return this.snakeHead;
  }
  get snakeHeadUI() {
    return this.snakeHeadNode?.getComponent(UITransform);
  }
  start() {
    this.init();
    // let spriteFrame = new SpriteFrame();
    // let sprite = new Sprite('header');
    // sprite.spriteFrame = spriteFrame
    //   console.log(this.curPos, Vec3);
    this.bulletNode = this.node.getChildByPath("bullet/bullet"); 
    this.snakeHead = this.node.getChildByPath("snake/head");
    console.log(this.node, this.snakeHead, PhysicsSystem2D.instance);
    // this.initNode();
  }
  // 物理碰撞
  onBeginContact(s:Collider2D, o:Collider2D, c) {
    console.log("触发碰撞", s, o);
    let totalGroup = s.group | o.group
    if (totalGroup & group.snake && totalGroup & group.food || totalGroup & group.bullet && totalGroup & group.food) { // 碰到食物
      let node = s.group & group.food ? s.node : o.node;
      let width = this.frameSize.width - node.getComponent(UITransform).width;
      let heihgt = this.frameSize.height - node.getComponent(UITransform).height;
      let x = (Math.random() - 0.5) * width
      let y = (Math.random() - 0.5) * heihgt
      console.log('重新生成', width, heihgt, x, y);
      this.scheduleOnce(() => {
        node.setPosition(x, y, 0)
      })
    } else if (totalGroup & group.snake && totalGroup & group.wall) { // 碰到墙壁
      this.gameOver = true;
      this.checkMoveOutFrame();
      console.log("遊戲結束");
    } else if (totalGroup & group.bullet && totalGroup & group.wall) {
      let bullet = s.group & group.bullet ? s : o;
      console.log('子弹命中墙', s.node.name,  bullet.tag, this.bulletCache[bullet.tag]);
      // tween(bullet.node).tag(bullet.tag).stop();
      this.scheduleOnce(() => {})
    }
  }
  onEndContact(s, o, c) {
    // console.log('onEndContact', s, o, c);
  }
  onPreSolve(s, o, c) {
    // console.log('onPreSolve', s, o, c);
  }
  onPostSolve(s, o, c) {
    // console.log('onPostSolve', s, o, c);
  }
  initNode() {
    return new Promise((reslove, reject) => {
      let node = new Node("header");
      let sprite = node.addComponent(Sprite);
      let nodeUi = sprite.getComponent(UITransform);
      nodeUi.setContentSize(10, 10);
      node.updateWorldTransform();
      assetManager.loadAny(
        `7d8f9b89-4fd1-4c9f-a3ab-38ec7cded7ca@f9941`,
        SpriteFrame,
        (err, spriteFrame) => {
          if (err) {
            console.log(err);
          }
          sprite.type = Sprite.Type.SIMPLE;
          sprite.sizeMode = Sprite.SizeMode.CUSTOM;
          sprite.color = new Color(0, 0, 0, 255);
          sprite.spriteFrame = spriteFrame;
          console.log(spriteFrame);
          reslove(true);
        }
      );
    });
  }
  onTouchMove (e) {
    const worldPos = new Vec3();
    let {x, y} = e.getUILocation();
    this.node.inverseTransformPoint(worldPos, new Vec3(x, y, 0))
    this.createBullet(worldPos);
    console.log(worldPos);
  }
  init() {
    this.createSnakeHeader();
    // 註冊按鈕事件
    systemEvent.on(SystemEvent.EventType.TOUCH_MOVE, this.onTouchMove, this);
    systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    // 注册全局碰撞回调函数
    PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT,this.onBeginContact,this);
    if (PhysicsSystem2D.instance) {
      // PhysicsSystem2D.instance.on(Contact2DType.END_CONTACT, this.onEndContact, this);
      // PhysicsSystem2D.instance.on(Contact2DType.PRE_SOLVE, this.onPreSolve, this);
      // PhysicsSystem2D.instance.on(Contact2DType.POST_SOLVE, this.onPostSolve, this);
    }
    // this.foodCreat.node.on('eatFood', this.onEatFood, this);
    // this.node.on('move', );
  }

  // 創建蛇頭
  createSnakeHeader() {
  }

  // 生成蛇身
  createSnakeBody(color) {
  }
  // 生成子彈
  createBullet (target:Vec3) {
    let bullet:Node;
    let tag: number = 0;
    // 有空闲子弹
    if (this.bulletNodePool.size() > 0) {
      bullet = this.bulletNodePool.get();
      tag = bullet.getComponent(CircleCollider2D).tag
      console.log('使用已有', tag);
    } else {
      this.bulletIndex++;
      bullet = instantiate(this.bulletNode);
      bullet.getComponent(CircleCollider2D).tag = this.bulletIndex;
      bullet.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, (o,s) => {
          console.log(11111,o,s)
      })
      tag = this.bulletIndex
      console.log('创建新的', tag);
    }
    console.log('发射', tag);
    this.node.getChildByPath('bullet').addChild(bullet);
    bullet.setPosition(this.snakeHeadNode.getPosition());
    let anime = tween(bullet).tag(tag).to(1, {position: target}).call(() => {
      console.log('结束', tag)
      anime.removeSelf()
      this.bulletNodePool.put(bullet);
    }).start()
  }

  drawSnakeBody() {
    if (this.snakeBodyList.length) {
      // 使用坐标渲染蛇身
      // 保存当前坐标到列表前
      let vec3ToArray = [];
      Vec3.toArray(vec3ToArray, this.curPos);
      this.snakeBodyRoute.unshift(vec3ToArray);
      // 限制列表长度
      this.snakeBodyRoute.length = this.snakeBodyList.length;
      // 渲染蛇身
      this.snakeBodyList.forEach((snakeBody, index) => {
        let vec3 = snakeBody.getPosition();
        Vec3.fromArray(vec3, this.snakeBodyRoute[index]);
        snakeBody.setPosition(vec3);
      });
    }
  }

  // 吃到食物
  onEatFood(color) {
    //  console.log('吃到食物', color)
    this.createSnakeBody(color);
    //  this.resetRunSpeed();
  }

  resetRunSpeed() {
    //   this._curRunSpeed = (this.defaultSpeed + this.speed + this.snakeBodyList.length * 10) / this._jumpTime
    this._curRunSpeed =
      (this.defaultSpeed + this.speed + this.snakeBodyList.length) /
      this._jumpTime;
  }
  // 按下键盘事件
  onKeyDown(ev) {
    // 相同多次點擊 提供加速度
    this.speed = ev.keyCode === this.curDir ? this.speed >= this.maxSpeed ? this.maxSpeed : this.speed + this.addSpeedStep: 0;
    if (
      (this.curDir === CtrlKey.up && ev.keyCode === CtrlKey.down) ||
      (this.curDir === CtrlKey.down && ev.keyCode === CtrlKey.up) ||
      (this.curDir === CtrlKey.left && ev.keyCode === CtrlKey.right) ||
      (this.curDir === CtrlKey.right && ev.keyCode === CtrlKey.left)
    ) {
      // this.gameOver = false;
      this.speed = this.speed < this.addSpeedStep ? 0 : this.speed - this.addSpeedStep;
      this.resetRunSpeed();
      return;
    } else if (ev.keyCode === CtrlKey.space) { // 按下空格
      let bullet:Node;
      let tag: number = 0;
      let x: number = 0;
      let y: number = 0;
      switch (this.curDir) {
        case CtrlKey.up:
          y = this.canvasSize.height;
          break;
        case CtrlKey.down:
          y = -this.canvasSize.height;
          break;
        case CtrlKey.left:
          x = -this.canvasSize.width;
          break;
        case CtrlKey.right:
          x = this.canvasSize.width;
          break;
        default:
          break;
      }
      // 有空闲子弹
      if (this.bulletNodePool.size() > 0) {
        bullet = this.bulletNodePool.get();
        tag = bullet.getComponent(CircleCollider2D).tag
        console.log('使用已有', tag);
      } else {
        this.bulletIndex++;
        bullet = instantiate(this.bulletNode);
        bullet.getComponent(CircleCollider2D).tag = this.bulletIndex;
        bullet.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, (o,s) => {
            console.log(11111,o,s)
        })
        tag = this.bulletIndex
        console.log('创建新的', tag);
      }
      console.log('发射', tag);
      this.node.getChildByPath('bullet').addChild(bullet);
      bullet.setPosition(this.snakeHeadNode.getPosition());
      let anime = tween(bullet).tag(tag).by(3, {position: new Vec3(x,y,0)}).call(() => {
        console.log('结束', tag)
        anime.removeSelf()
        this.bulletNodePool.put(bullet);
      }).start()
      this.scheduleOnce(() => {

        // console.log(x,y);
        // setTimeout(() => {
        //   console.log(this.snakeHeadNode.getPosition());
        //   this.bulletNodePool.put(bullet);
        // }, 1000)
      })
      return
    }
    // 設置當前運動方向
    this.curDir = CtrlKey[ev.keyCode] ? ev.keyCode : 0;
    this.gameOver = false
    // 設置當前移動速度
    this.resetRunSpeed();
  }

  // 每幀移動距離
  checkDirection(deltaTime: number): Array<number> {
    let distance = this._curRunSpeed * deltaTime;
    // 限制移动最大距离
    distance =
      distance > this.snakeHeadUI.width ? this.snakeHeadUI.width : distance;
    switch (this.curDir) {
      case CtrlKey.up:
        return [0, distance, 0];
      case CtrlKey.down:
        return [0, distance * -1, 0];
      case CtrlKey.left:
        return [distance * -1, 0, 0];
      case CtrlKey.right:
        return [distance, 0, 0];
      default:
        return [0, 0];
    }
  }

  // 檢查觸碰邊界
  checkMoveOutFrame() {
    // 右邊
    // console.log(this.curPos.x + this.snakeHeadUI.width, this.frameSize.width)
    let width = this.frameSize.width / 2 - this.snakeHeadUI.width / 2;
    let heihgt = this.frameSize.height / 2 - this.snakeHeadUI.height / 2;
    let x = this.curPos.x;
    let y = this.curPos.y;
    let z = 0;
    switch (this.curDir) {
      case CtrlKey.left:
        x = -width;
        break;
      case CtrlKey.right:
        this.curPos.set(0, this.curPos.y, 0);
        x = width;
        break;
      case CtrlKey.up:
        this.curPos.set(this.curPos.x, heihgt, 0);
        y = heihgt;
        break;
      case CtrlKey.down:
        this.curPos.set(this.curPos.x, -heihgt, 0);
        y = -heihgt;
        break;
      default:
        break;
    }
    this.curPos.set(x, y, z);
    this.scheduleOnce(() => {
      this.snakeHead.setPosition(x, y, z);
    })
    console.log(this.snakeHead, this.curDir, this.curPos);
    this.curDir = null;
    // if (this.curPos.x + this.snakeHeadUI.width > width) {
    //   this.curDir = CtrlKey.null;
    //   this.curPos.set(this.frameSize.width - this.snakeHeadUI.width, this.curPos.y, 0);
    //   return true
    // // 左邊
    // } else if (this.curPos.x < -width) {
    //   this.curDir = CtrlKey.null;
    //   this.curPos.set(0, this.curPos.y, 0);
    //   return true
    //   // 上邊
    // } else if (this.curPos.y + this.snakeHeadUI.width > heihgt) {
    //   this.curDir = CtrlKey.null;
    //   this.curPos.set(this.curPos.x , heihgt, 0);
    //   return true
    //   // 下邊
    // } else if (this.curPos.y < -heihgt) {
    //   this.curDir = CtrlKey.null;
    //   this.curPos.set(this.curPos.x, -heihgt, 0);
    //   return true
    // }
    // return false
  }
  // 檢查头撞身体
  checkHeadCollideBody(position: Vec3) {
    // 在前进方向生成真空区
    let collideRect = new Rect(position.x, position.y, 0.1, 0.1);
    switch (this.curDir) {
      case CtrlKey.right:
        collideRect.set(
          position.x + this.snakeHeadUI.width + 1,
          position.y + this.snakeHeadUI.height / 2,
          0.1,
          0.1
        );
        break;
      case CtrlKey.left:
        collideRect.set(
          position.x - 1.1,
          position.y + this.snakeHeadUI.height / 2,
          0.1,
          0.1
        );
        break;
      case CtrlKey.up:
        collideRect.set(
          position.x + this.snakeHeadUI.width / 2,
          position.y + this.snakeHeadUI.height + 1,
          0.1,
          0.1
        );
        break;
      case CtrlKey.down:
        collideRect.set(
          position.x + this.snakeHeadUI.width / 2,
          position.y - 1.1,
          0.1,
          0.1
        );
        break;
      default:
        return;
    }
    let isCollide = this.snakeBodyList.some((item) =>
      item.getComponent(UITransform).getBoundingBox().intersects(collideRect)
    );
    isCollide && (this.curDir = CtrlKey.null);
    return isCollide;
  }
  update(deltaTime: number) {
    if (this.curDir && this.snakeHead && !this.gameOver) {
      this.snakeHeadNode.getPosition(this.curPos);
      this._deltaPos.set(...this.checkDirection(deltaTime));
      Vec3.add(this.curPos, this.curPos, this._deltaPos);
      this.snakeHeadNode.setPosition(this.curPos);
    }
  }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/zh/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/zh/scripting/life-cycle-callbacks.html
 */
