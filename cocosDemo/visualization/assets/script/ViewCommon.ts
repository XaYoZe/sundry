import { _decorator, Component, Node, instantiate, tween, math, Camera, Script } from 'cc';
import * as cc from 'cc'
const { ccclass, property } = _decorator;

type FindPath <Str extends string> = Str extends `${ infer Name }#${ infer Params }` ? Params extends keyof typeof cc ? (typeof cc)[Params] extends { new (...args: any):infer R} ? R : (typeof cc)[Params] : never : InstanceType<(typeof cc)['Node']>;

@ccclass('ViewCommon')

export class ViewCommon extends Component {
  inited: boolean = false;
  init (config: any) {}
  updateView (arr: any, deltaTime?: number) {}
  find<NamePath extends string> (name:NamePath, target: any = this):FindPath<NamePath> {
    let curNode = target.node || target;
    let keys = name.split('/');
    if (!name) return null;
    for (let i = 0; i < keys.length; i++) {
      let childPath = keys[i];
      let [childName, componentName] = childPath.split('#');
      if (childName) {
        curNode = curNode.getChildByName(childName);
      }
      if (!curNode) return null;
      if (componentName) {
        curNode = curNode.getComponent(cc[componentName] || componentName);
      }
    }
    return curNode
  }
}