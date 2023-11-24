import { CCObject } from "cc";
import {
  _decorator,
  Component,
  Node,
  Asset,
  assetManager,
  Eventify,
} from "cc";
const { ccclass, property, disallowMultiple, executeInEditMode } = _decorator;



export class AnimaConfig {
  @property
  config = '';

}

@ccclass("ReadConfig")

@executeInEditMode
@disallowMultiple
export class ReadConfig extends Component {
  @property(Asset)
  config:Asset;
  @property(AnimaConfig)
  configDir:AnimaConfig;
  protected onLoad(): void {
    console.log(this.config)
    console.log(this.configDir);
    // assetManager.loadBundle("Drink", (err, data) => {
    //   console.log(err, data);
    // });
  }

  update(deltaTime: number) {}
}
