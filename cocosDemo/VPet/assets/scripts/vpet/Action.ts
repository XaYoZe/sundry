import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('actionCtrl')
export class actionCtrl extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    changeStatus (data) {
      console.log(data);
    }
}


