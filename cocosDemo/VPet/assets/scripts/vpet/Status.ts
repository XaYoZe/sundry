import { _decorator, Component, Node, Prefab } from 'cc';
import { BaseModel } from './BaseModel';

const { ccclass, property } = _decorator;

enum status {
  'Happy',
  'Ill',
  'Nomal',
  'PoorCondition',
}

interface LoopPorperty {
  Happy?: Node;
  Ill?: Node;
  Nomal?: Node;
  PoorCondition?: Node;
}

@ccclass('Status')
export class Status extends Component {
    status:LoopPorperty = {}
    curPlayStatus = '';
    start() {
      console.log(this.node.children);
      this.node.children.forEach(item => {
        this.status[item.name] = item;
      })
    }

    update(deltaTime: number) {
        
    }
    changeStatus (data: status) {
      let statusList = ['Happy', 'Ill', 'Nomal', 'PoorCondition'];
      if (this.curPlayStatus) {
        this.status[this.curPlayStatus].active = false;
        this.status[this.curPlayStatus].getComponent(BaseModel).stop().then(res => {
          console.log('切换动作');
          this.curPlayStatus = statusList[Math.floor(Math.random() * 4)]
          this.status[this.curPlayStatus].active = true;
          this.status[this.curPlayStatus].getComponent(BaseModel).play();
        });
        return
      }
      this.curPlayStatus = statusList[Math.floor(Math.random() * 4)]
      this.status[this.curPlayStatus].active = true;
      this.status[this.curPlayStatus].getComponent(BaseModel).play();
      // this.curPlayStatus = data;
      console.log(data);
    }
}


