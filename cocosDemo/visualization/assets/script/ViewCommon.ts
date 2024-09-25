import { _decorator, Component, Node, instantiate, tween, math, Camera, Script } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('ViewCommon')
export class ViewCommon extends Component {
  inited: boolean = false;
  init (config: any) {}
  updateView (arr: any, deltaTime?: number) {}
}