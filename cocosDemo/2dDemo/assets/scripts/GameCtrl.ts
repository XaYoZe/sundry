
import { _decorator, Component, Node } from 'cc';
import { SnakeCtrl } from './SnakeCtrl';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = GameCtrl
 * DateTime = Sun Sep 26 2021 14:46:22 GMT+0800 (中国标准时间)
 * Author = yang135789
 * FileBasename = GameCtrl.ts
 * FileBasenameNoExtension = GameCtrl
 * URL = db://assets/scripts/GameCtrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/zh/
 *
 */
 
@ccclass('GameCtrl')
export class GameCtrl extends Component {
  @property({type: SnakeCtrl})
  private snakeCtrl: SnakeCtrl | null;
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        // [3]
        console.log(this.snakeCtrl);
        this.snakeCtrl.init();
        // 蛇頭移動觸發
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
