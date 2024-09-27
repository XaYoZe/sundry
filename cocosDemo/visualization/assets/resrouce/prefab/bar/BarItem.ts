import {
  _decorator,
  Component,
  Node,
  math,
  RigidBody,
  ParticleSystem,
  BoxCollider,
  tween,
  Tween,
  Collider,
  Color,
  MeshRenderer,
  instantiate,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("BarItem")
export class BarItem extends Component {
  @property(Color)
  topColor: Color = math.color(138, 0, 0, 255);
  @property(Color)
  bottomColor: Color = math.color(143, 255, 0, 255);
  @property
  widthScale: number = 0.9;
  topRigidBody: RigidBody;
  topCollider: Collider;
  topNode: Node;
  bottomNode: Node;
  height: number;
  cacheHeight: number;
  tweenCache: Tween<Node> = null;
  deboundTimeCache: number = 0;
  deboundTime: number = 0.05;
  start () {
  }
  init (index: number = 0) {
    this.topNode = this.node.getChildByName("Top");
    this.topNode.setScale(
      1 * this.widthScale,
      this.node.scale.x * this.widthScale,
      this.node.scale.x * this.widthScale
    );
    this.topNode.setPosition(
      (1 - this.widthScale) / 2,
      this.node.scale.x * this.widthScale,
      0
    );
    this.topNode.getComponent(MeshRenderer).material.setProperty("emissive", this.topColor);
    this.topRigidBody = this.node.getChildByName("Top").getComponent(RigidBody);
    this.topRigidBody.useCCD = true;
    this.topCollider = this.node.getChildByName("Top").getComponent(Collider);
    this.topCollider.on('onCollisionEnter', () => {
      if (this.topNode.position.y > this.topNode.scale.y) {
        this.palyParticle();
      }
    })

    this.bottomNode = this.node.getChildByName("Bottom");
    this.bottomNode.setScale(
      1 * this.widthScale,
      0,
      this.node.scale.x * this.widthScale
    );
    this.bottomNode.setPosition((1 - this.widthScale) / 2, 0, 0);
    this.bottomNode.getComponent(MeshRenderer).material.setProperty("emissive", this.bottomColor);
  }
  ParticleNodeList:ParticleSystem[] = []; 
  /** 播放粒子特效 */
  palyParticle () {
    let curTime = Date.now();
    if (this.deboundTime * 1000 < curTime - this.deboundTimeCache) {
      let useOld = false;
      this.ParticleNodeList.forEach(item => {
        if (item.isStopped && !useOld) {
          useOld = true;
          item.play()
        }
      })
      if (!useOld) {
        let ParticleNode = instantiate(this.topCollider.node.getChildByName("Particle"));
        ParticleNode.parent = this.topNode;
        let Particle = ParticleNode.getComponent(ParticleSystem);
        Particle.play();
        this.ParticleNodeList.push(Particle);
      }
      this.deboundTimeCache = curTime;
    } else {
    }
  }
  updateView(val, deltaTime: number) {
    this.height = val;
    if (this.height != this.cacheHeight) {
      this.cacheHeight = this.height;
      // this.tweenCache?.stop()
      // this.tweenCache = tween(this.bottomNode).to(deltaTime, { scale: new math.Vec3(
      //   this.bottomNode.scale.x,
      //   this.height,
      //   this.bottomNode.scale.z), position: new math.Vec3(this.bottomNode.position.x, this.height / 2, 0) }).start();
      this.bottomNode.setScale(
        this.bottomNode.scale.x,
        this.height,
        this.bottomNode.scale.z
      );
      this.bottomNode.setPosition(
        this.bottomNode.position.x,
        this.height / 2,
        0
      );
    }
    if (this.topNode.position.y < this.height) {
      this.topNode.setPosition(
        this.topNode.position.x,
        this.height + this.topNode.scale.y,
        0
      );
      this.palyParticle();
    }
  }
  onClick() {}
  update(deltaTime: number) {
    // console.log(deltaTime, length);
    // this.topRigidBody.setLinearVelocity(new math.Vec3(0, -100, 0));
  }
}
