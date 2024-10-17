import { _decorator, Component, Node, Line, Camera, math, Vec3, Graphics, utils } from 'cc';
import { ViewCommon } from '../../../script/ViewCommon';
import { Geometry } from './Geometry'
const { ccclass, property } = _decorator;

@ccclass('LineView')
export class LineView extends ViewCommon {
    lineItem: Line = null;
    offsetWidth: number = 1;
    coorCache: Vec3[] = [];
    GraphicsItem: Graphics = null;
    geometry: Geometry = null;
    baseY: number = 0;
    baseX: number = 0;
    init (config: {size: number, width: number}) {
      // this.lineItem = this.node.getChildByName('LineItem').getComponent(Line);
      let size = config.size;
      let cameraNode = this.node.getChildByName('Camera')
      let camera = cameraNode.getComponent(Camera);
      let GraphicsItem = this.node.getComponentInChildren(Graphics);
      this.scheduleOnce(() => {
        /** 攝像機x起點 */
        let {x: xStart, y: yStart} = camera.screenToWorld(new math.Vec3(0, 0, 0));
        /** 攝像機x終點 */
        let {x: xEnd, y: yEnd } = camera.screenToWorld(new math.Vec3(camera.camera.width, camera.camera.height, 0));
        /** 計算寬度 */
        this.offsetWidth = (xEnd - xStart) / (size - 1);
        xStart = xStart - (xEnd - xStart) / 2;
        xEnd = xEnd + (xEnd - xStart) / 2;
        this.baseX = xStart;
        this.baseY = -(yEnd - yStart) / 2;
        let arr =[];
        for (let i = 0; i < size; i++) {
          this.coorCache.push(new Vec3(this.baseX + (i * this.offsetWidth) , this.baseY, 0));
          arr.push(Math.round(Math.random() * 255));
        }
        this.GraphicsItem = GraphicsItem;
        this.inited = true;
        this.updateView(new Uint8Array(arr), 10);
      })
      return
    }
    updateView(u8aCache: Uint8Array, deltaTime: number) {
      let arr = [];
      this.GraphicsItem.clear();
      u8aCache.forEach((item, i, src) => {
        let prev = {x: this.baseX + (i * this.offsetWidth) , y: this.baseY + Math.max(0, item)};
        if (isNaN(src[i + 1])) {
          return
        };
        let next = {x: this.baseX + ((i + 1) * this.offsetWidth), y: this.baseY + Math.max(0, src[i + 1])}
        if (i == 0) {
          this.GraphicsItem.moveTo(prev.x, prev.y);
        }
        this.GraphicsItem.bezierCurveTo((prev.x + next.x) / 2, prev.y, (prev.x + next.x) / 2, next.y , next.x , next.y );
      })
      this.GraphicsItem.stroke();
    }
}


