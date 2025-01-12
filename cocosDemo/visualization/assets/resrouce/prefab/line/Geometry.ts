import { _decorator, Component, Camera, Color, geometry, Vec3 } from 'cc';
const { ccclass, property, executeInEditMode} = _decorator;

@ccclass('Geometry')
@executeInEditMode(true)
export class Geometry extends Component {

    @property(Camera)
    mainCamera:Camera = null;

    init () {        
      this.mainCamera?.camera.initGeometryRenderer();
      console.log(this.mainCamera?.camera);
    }

    updateView(arr: Vec3[]) {
      this.mainCamera?.camera?.geometryRenderer?.addSpline(geometry.Spline.create(geometry.SplineMode.CATMULL_ROM, arr), Color.GREEN, 0, arr.length);
    }
}