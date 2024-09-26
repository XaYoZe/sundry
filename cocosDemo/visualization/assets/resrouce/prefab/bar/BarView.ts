import { _decorator, Component, Node, instantiate, tween, math, Camera, NodeEventType, renderer, view } from 'cc';
import { ViewCommon } from '../../../script/ViewCommon';
import { BarItem } from './BarItem';
const { ccclass, property } = _decorator;


@ccclass('BarView')
export class BarView extends ViewCommon {
    @property(BarItem)
    BarItemNode: BarItem;
    lineNodeList: any[] = [];
    init (config: {size: number, width: number}) {
      let size = config.size ;
      let cameraNode = this.node.getChildByName('Camera')
      let camera = cameraNode.getComponent(Camera)
      this.scheduleOnce(() => {
        /** 攝像機x起點 */
        let {x: xStart} = camera.screenToWorld(new math.Vec3(0, 0, 0));
        /** 攝像機x終點 */
        let {x: xEnd } = camera.screenToWorld(new math.Vec3(camera.camera.width, 0, 0));
        /** 計算寬度 */
        let width  = (xEnd - xStart) / size;
        for (let i = 0; i < size; i++) {
          let nodeItem = instantiate(this.BarItemNode.node);
          nodeItem.setScale(width, 1, 1)
          nodeItem.setPosition(xStart + (i * width) + (0.5 * width) , 0, 0);
          this.node.addChild(nodeItem);
          this.lineNodeList.push(nodeItem);
          nodeItem.active = true;
        }
        this.inited = true;
      })
    }
    updateView (u8aCache: Uint8Array, deltaTime: number) {
      u8aCache.forEach((item, index) => {
        this.lineNodeList[index].getComponent(BarItem).updateView(item, deltaTime)
      })
    }
}
// 

