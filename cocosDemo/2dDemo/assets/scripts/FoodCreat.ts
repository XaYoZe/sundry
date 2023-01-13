
import { _decorator, Component, Node, Prefab, Vec3, instantiate, View, Sprite, math, Color, UITransform, Rect, systemEvent, SystemEvent, EventMouse, Vec2, director } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = FoodCreat
 * DateTime = Fri Sep 24 2021 11:35:39 GMT+0800 (中国标准时间)
 * Author = yang135789
 * FileBasename = FoodCreat.ts
 * FileBasenameNoExtension = FoodCreat
 * URL = db://assets/scripts/FoodCreat.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 
@ccclass('FoodCreat')
export class FoodCreat extends Component {

  @property({type: Prefab})
  public foodPrfb: Prefab | null = null;

  @property
  public foodNum: number = 10;

  public foodList: Array<Node> = [];

  private view:View = new View();
  
  private frameSize = this.view.getFrameSize();

  private snakeBodyList: Array<Node> = [];
    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
      this.node.setPosition(0,0,0);
      this.generateFood();
        // systemEvent.on(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
        // console.log(this.foodPrfb);
    }

    onMouseDown (ev: EventMouse) {
      let {x, y} = ev.getLocationInView();
      let coor = new Vec2()
      console.log(1111, director.convertToGL(ev.getLocationInView()), director.convertToUI(ev.getLocationInView()));
      this.foodList.forEach(item => {
        let coor1 = this.view.convertToLocationInView(x, y, {left: this.frameSize.width / 2, top: this.frameSize.height/2, height: this.frameSize.height, width: this.frameSize.width}, coor)
        console.log('食物', item.getComponent(UITransform).getBoundingBox(), '事件:', coor, coor1);
        console.log(item.getComponent(UITransform).getBoundingBox().contains(ev.getLocationInView(coor1)));
        if (item.getComponent(UITransform).getBoundingBox().contains(ev.getLocationInView(coor))) {
            console.log('事件:', {x, y}, this.foodList, coor);
        }
      })
    }

    randomColor():Color {
      let r = math.randomRangeInt(0, 255);
      let g = math.randomRangeInt(0, 255);
      let b = math.randomRangeInt(0, 255);
      let a = math.randomRangeInt(70, 255);
      return new Color(r,g,b,a);
    }

    // 生成食物坐標
    /**
     * 
     * @param foodNode 食物節點
     * @param oldRect 坐標重複繼續使用舊矩陣對象
     * @returns 
     */
    randomCoordinate(foodNode: Node, oldRect?: Rect):Vec3 {
      let vec3 = foodNode.getPosition();
      let offset = 5; // 偏移量
      let foodNodeUI = foodNode.getComponent(UITransform);
      // 隨機生成x軸y軸坐標
      let x = math.randomRangeInt(0, this.frameSize.width - foodNodeUI.width - 0);
      let y = math.randomRangeInt(0, this.frameSize.height - foodNodeUI.height - 0);
      let z = 0;
      // 矩形范围
      let rectParams = [x - offset, y - offset, foodNodeUI.width + offset * 2, foodNodeUI.height + offset * 2];
      let rect = oldRect ? oldRect.set(...rectParams) : new Rect(...rectParams);
      // 和現有的列表是否有重複
      let isRepeat = this.foodList.some(item=> item.getComponent(UITransform).getBoundingBox().intersects(rect));
      let isCollideBody = this.snakeBodyList.some(item=> item.getComponent(UITransform).getBoundingBox().intersects(rect));

      if (isRepeat || isCollideBody) {
        console.log('坐標重複, 重新生成!');
        return this.randomCoordinate(foodNode, rect);
      }
      return vec3.set(x, y, z);
    }

    // 創建食物
    createFood (oldNode ?: Node) {
      let foodNode = oldNode || instantiate(this.foodPrfb);
      // 修改食物顏色
      foodNode.getComponent(Sprite).color.set(this.randomColor());
      // 修改食物坐標
      foodNode.setPosition(this.randomCoordinate(foodNode));
      // food
      this.node.addChild(foodNode);
      this.foodList.push(foodNode);
    }
    generateFood () {
      this.node.removeAllChildren();
      for (let i = 0; i < this.foodNum; i++) {
        this.createFood();
      }
      console.log('食物列表', this.foodList);
    }

    /**
     * 检查蛇是否接触食物
     * @param snakeHeadNode 蛇頭節點
     */
    checkSnakeEatFood (snakeHeadNode: Node, snakeBody) {
      this.foodList.forEach(foodNode => {
        let foodNodeUI = foodNode.getComponent(UITransform);
        let snakeHeadUI = snakeHeadNode.getComponent(UITransform)
        if (foodNodeUI.getBoundingBox().intersects(snakeHeadUI.getBoundingBox()) && foodNode.active) {
          console.log('碰到食物', foodNode);
          this.setSnakeBodyList(snakeBody);
          this.node.emit('eatFood', foodNode.getComponent(Sprite).color);
          this.removeFood(foodNode);
          // item.node.active = false;
        }
      })
      
    }
    /**
     * 
     * @param targetNodeUI 食物的
     * @param reset 是否重新生成或刪除
     */
    removeFood (targetNode: Node, reset: boolean = true) {
      let index = this.foodList.indexOf(targetNode);
      if (index !== -1) {
        if (reset) {
          // 重新生成坐標
          this.createFood(targetNode);
        } else {
          this.foodList.splice(index,1);
          targetNode.destroy()
        }
      }
    }

    setSnakeBodyList (array: Array<Node>) {
       this.snakeBodyList = array;
    }
    // update (deltaTime: number) {
    //     // [4]
    // }
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
