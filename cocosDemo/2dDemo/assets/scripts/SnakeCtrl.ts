
import { _decorator, Component, instantiate, Node, Vec3, UITransform, Prefab, Sprite, quat, systemEvent, SystemEvent, View , Rect } from 'cc';
const { ccclass, property } = _decorator;
import { FoodCreat } from './FoodCreat';

/**
 * Predefined variables
 * Name = Fish
 * DateTime = Wed Sep 22 2021 17:08:38 GMT+0800 (中国标准时间)
 * Author = yang135789
 * FileBasename = fish.ts
 * FileBasenameNoExtension = fish
 * URL = db://assets/scripts/fish.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */

// 按键code
enum CtrlKey {
  null = 0,
  up = 38,
  down = 40,
  left = 37,
  right = 39
}
@ccclass('SnakeCtrl')
export class SnakeCtrl extends Component {
    // [1]
    // 
    @property({type: Prefab})
    public snakePrfb: Prefab | null = null;

    @property({type: FoodCreat})
    private foodCreat: FoodCreat | null;
    // 当前按鈕方向
    private curDir: CtrlKey;
    // 當前坐標
    private curPos: Vec3 = new Vec3();
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);
    private _curRunSpeed: number = 50;
    private _jumpTime: number = 1;

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
    private view: View = new View;
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

    get snakeHeadNode () {
      return this.snakeHead
    }
    get snakeHeadUI () {
      return this.snakeHeadNode?.getComponent(UITransform)
    }
    start () {
      this.node.setPosition(0,0,0);
    //   console.log(this.curPos, Vec3);
    }

    init () {
      this.createSnakeHeader();

      // 註冊按鈕事件
      systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
      this.foodCreat.node.on('eatFood', this.onEatFood, this);
      // this.node.on('move', );
    }

    // 創建蛇頭
    createSnakeHeader () {
      this.snakeHead = instantiate(this.snakePrfb);
      this.snakeHead.getComponent(Sprite).color.set(0,0,0,255);
      this.snakeHead.setPosition(0, 0, 0);
      this.node.addChild(this.snakeHead);
    }

    // 生成蛇身
    createSnakeBody (color) {
      let snakeBody = instantiate(this.snakePrfb);
      let vec3 = snakeBody.getPosition();
      this.snakeHead.getPosition(vec3);
      snakeBody.getComponent(Sprite).color.set(0,0,0, 50);
      snakeBody.setPosition(vec3);
      this.node.addChild(snakeBody);
      this.snakeBodyList.push(snakeBody);
      // 讓蛇頭一直顯示在頂部
      this.node.removeChild(this.snakeHead);
      this.node.addChild(this.snakeHead);
    }

    drawSnakeBody () {
      if (this.snakeBodyList.length) {
        // 使用坐标渲染蛇身
        // 保存当前坐标到列表前
        let vec3ToArray = []
        Vec3.toArray(vec3ToArray, this.curPos)
        this.snakeBodyRoute.unshift(vec3ToArray);
        // 限制列表长度
        this.snakeBodyRoute.length = this.snakeBodyList.length;
        // 渲染蛇身
        this.snakeBodyList.forEach((snakeBody, index) => {
          let vec3 = snakeBody.getPosition();
          Vec3.fromArray(vec3,this.snakeBodyRoute[index]);
          snakeBody.setPosition(vec3);
        })

        // this.snakeBodyDirection.unshift(this.curDir)
        // this.snakeBodyDirection.length = this.snakeBodyList.length;
        // let cacheVec3 = this.curPos;
        // this.snakeBodyList.forEach((snakeBody, index) => {
        //   let bodyVec3 = snakeBody.getPosition();
        //   console.log(this.snakeBodyDirection[index], this.snakeBodyDirectionMapping[this.snakeBodyDirection[index]]);
        //   Vec3.add(bodyVec3, cacheVec3, this.snakeBodyDirectionMapping[this.snakeBodyDirection[index]]);
        //   snakeBody.setPosition(bodyVec3);
        //   cacheVec3 = bodyVec3;
        // })
      }
    }

    // 吃到食物
    onEatFood (color) {
    //  console.log('吃到食物', color)
     this.createSnakeBody(color);
    //  this.resetRunSpeed();
    }

    resetRunSpeed () {
    //   this._curRunSpeed = (this.defaultSpeed + this.speed + this.snakeBodyList.length * 10) / this._jumpTime
      this._curRunSpeed = (this.defaultSpeed + this.speed + this.snakeBodyList.length) / this._jumpTime
    }
    // 按下键盘事件
    onKeyDown (ev) {
      // 相同多次點擊 提供加速度
      this.speed = ev.keyCode === this.curDir ? this.speed >= this.maxSpeed ? this.maxSpeed : this.speed + this.addSpeedStep : 0;

      if (
        this.curDir === CtrlKey.up && ev.keyCode === CtrlKey.down ||
        this.curDir === CtrlKey.down && ev.keyCode === CtrlKey.up ||
        this.curDir === CtrlKey.left && ev.keyCode === CtrlKey.right ||
        this.curDir === CtrlKey.right && ev.keyCode === CtrlKey.left
      ) {
        this.speed = this.speed < this.addSpeedStep ? 0 : this.speed - this.addSpeedStep;
        this.resetRunSpeed();
        return
      }
      // 設置當前運動方向
      this.curDir = CtrlKey[ev.keyCode] ? ev.keyCode : 0;
      
      // 設置當前移動速度
      this.resetRunSpeed();

    }


    // 每幀移動距離
    checkDirection (deltaTime: number): Array<number> {
      let distance = this._curRunSpeed * deltaTime;
      // 限制移动最大距离
      distance = distance > this.snakeHeadUI.width ? this.snakeHeadUI.width : distance; 
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
          return [0, 0]
      }
    }

    // 檢查觸碰邊界
    checkMoveOutFrame () {
      // 右邊
      if (this.curPos.x + this.snakeHeadUI.width > this.frameSize.width) {
        this.curDir = CtrlKey.null;
        this.curPos.set(this.frameSize.width - this.snakeHeadUI.width, this.curPos.y, 0);
        return true
      // 左邊
      } else if (this.curPos.x < 0) {
        this.curDir = CtrlKey.null;
        this.curPos.set(0, this.curPos.y, 0);
        return true
        // 上邊
      } else if (this.curPos.y + this.snakeHeadUI.width > this.frameSize.height) {
        this.curDir = CtrlKey.null;
        this.curPos.set(this.curPos.x , this.frameSize.height - this.snakeHeadUI.width, 0);
        return true
        // 下邊
      } else if (this.curPos.y < 0) {
        this.curDir = CtrlKey.null;
        this.curPos.set(this.curPos.x, 0, 0);
        return true
      } 
      return false
    }
    // 檢查头撞身体
    checkHeadCollideBody (position: Vec3) {
        // 在前进方向生成真空区
        let collideRect = new Rect(position.x , position.y, 0.1 , 0.1);;
        switch (this.curDir) {
            case CtrlKey.right: 
            collideRect.set(position.x + this.snakeHeadUI.width + 1 , position.y + this.snakeHeadUI.height / 2, 0.1 , 0.1);
            break;
            case CtrlKey.left: 
            collideRect.set(position.x - 1.1 , position.y + this.snakeHeadUI.height / 2, 0.1 , 0.1);
            break;
            case CtrlKey.up: 
            collideRect.set(position.x + this.snakeHeadUI.width / 2 , position.y + this.snakeHeadUI.height + 1, 0.1 , 0.1);
            break;
            case CtrlKey.down: 
            collideRect.set(position.x + this.snakeHeadUI.width / 2 , position.y - 1.1, 0.1 , 0.1);
            break;
            default:
                return
        }
        let isCollide = this.snakeBodyList.some(item=> item.getComponent(UITransform).getBoundingBox().intersects(collideRect));
        isCollide && (this.curDir = CtrlKey.null);
        return isCollide;
    }

    // 自動吃
    ai () {
      let min = Infinity;
      let cache = null;
      this.foodCreat.foodList.forEach(food => {
        let val = Vec3.distance(food.getPosition(), this.curPos);
        if (val < min) {
          cache = food;
          min = val;
        }
      })
      let {x,y,width,height} = cache.getComponent(UITransform).getBoundingBox();
      // console.log(this.curPos, {x,y,width,height})
      if (this.curPos.x < x) {
        this.curDir = CtrlKey.right;
      } else if (this.curPos.x >= x + width) {
        this.curDir = CtrlKey.left;
      } else if (this.curPos.y < y) {
        this.curDir = CtrlKey.up;
      }else if (this.curPos.y >= y + height) {
        this.curDir = CtrlKey.down;
      } 
    } 

    update (deltaTime: number) {
    //   this.ai();
      if (this.curDir && this.snakeHead) {
        this.snakeHeadNode.getPosition(this.curPos);
        this._deltaPos.set(...this.checkDirection(deltaTime));
        Vec3.add(this.curPos, this.curPos, this._deltaPos);
        // 檢查觸碰邊界
        if (this.checkMoveOutFrame()) {
          console.log('遊戲結束');
        };
        if (this.checkHeadCollideBody(this.curPos)) {
            console.log('撞到身体');
        }
        this.snakeHeadNode.setPosition(this.curPos);
        // 檢查是否吃到食物
        this.foodCreat.checkSnakeEatFood(this.snakeHead, this.snakeBodyList);
        // 渲染蛇身
        this.drawSnakeBody();
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
 