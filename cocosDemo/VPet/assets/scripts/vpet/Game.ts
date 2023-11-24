import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameControl')
export class gameControl extends Component {
    protected onLoad(): void {
      this.node.children.forEach(item => {
        console.log(item);
      })
    }
    start() {

    }

    update(deltaTime: number) {
        
    }
}


