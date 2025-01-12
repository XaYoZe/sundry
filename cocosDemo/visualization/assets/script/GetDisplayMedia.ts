import { _decorator, Component, Node, VideoPlayer, Enum, Script, macro } from "cc";
import { ViewCommon } from "./ViewCommon";
const { ccclass, property, integer } = _decorator;

enum DataType {
  /** 分析器节点 */
  ByteFrequency = 0,
  ByteTimeDomain = 1,
}


enum ViewType {
  BarView = 0,
  LineView = 1,
}

@ccclass("GetDisplayMedia")
export class GetDisplayMedia extends Component {
  
  @property({ type: Enum(DataType), displayName: "可视化數據类型" })
  DateType: DataType = DataType.ByteFrequency;
  
  @integer
  @property({ displayName: 'FFTSize等級', min: 0, max: 10, step: 1, slide: true })
  level: number = 3;
  
  @property({ displayName: '帧平均偏移', min: 0, max: 1, step: 0.1, slide: true  })
  smoothingTimeConstant: number = 0.8;

  @integer
  @property({ displayName: '最小分貝' })
  minDecibels = -100;
  
  @integer
  @property({ displayName: '最大分貝' })
  maxDecibels = -30;
  
  /** 可視化類型 */
  @property({ type: Enum(ViewType), displayName: '顯示類型' })
  ViewType: ViewType = ViewType.BarView;

  /** 分析器节点 */
  analyser: AnalyserNode;
  /** 播放 */
  startPlay: boolean;

  /** 可視化數據緩存 */
  u8aCache: Uint8Array;

  get fftSize(): number {
    return 2 ** (5 + this.level);
  }
  
  useView: ViewCommon

  start() {
    this.useView = this.node.getChildByName(ViewType[this.ViewType]).getComponent(ViewCommon)
    this.useView.node.active = true;
    this.deltaTime = Date.now();
    if ((window as any).wallpaperRegisterAudioListener) {
      (window as any).wallpaperRegisterAudioListener(this.wallpaperAudioListener.bind(this));
    } else {
      this.useView.init({size: this.fftSize / 2, width: 960 / (this.fftSize / 2)})
      this.init();
    }
  }
  deltaTime: number = 0;
  wallpaperAudioCache: number[] = [];
  wallpaperAudioListener(audioArray:[]) {
    let cur = Date.now();
    // console.log(audioArray);
    if (!this.useView.inited) {
      this.useView.init({size: audioArray.length, width: 960 / audioArray.length})
    } else {
      audioArray.forEach((item, index) => {
        if (index <= 63) {
          this.wallpaperAudioCache[63 - index] = item * 100;
        } else {
          this.wallpaperAudioCache[index] = item * 100;
        }
      })
      // console.log(this.wallpaperAudioCache);
      this.useView.updateView(this.wallpaperAudioCache, (cur - this.deltaTime) / 1000);
    }
    this.deltaTime = cur;
    // Handle audio input here
  }

  init() {
    // 获取设备權限
    navigator.mediaDevices
      ?.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
        },
      })
      .then((mediaStream) => {
        console.log(mediaStream);
        this.visualization(mediaStream);
      });
  }
  
  visualization (mediaStream) {
    // 創建音頻對象
    var audioCtx = new window.AudioContext();
    // analyser.minDecibels = -90;
    // analyser.maxDecibels = -10;
    // 創建音源
    var source = audioCtx.createMediaStreamSource(mediaStream);
    
    // 創建可視化處理
    var analyser = audioCtx.createAnalyser();
    analyser.fftSize = this.fftSize; // 可視化柱子數量[32, 32768]
    analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    source.connect(analyser);
    // let gainNode =  audioCtx.createGain(); // 音频处理模块
    // gainNode.connect(audioCtx.destination); // 实例链接到音频处理
    this.u8aCache = new Uint8Array(analyser.frequencyBinCount);
    this.analyser = analyser
    this.startPlay = true;
  }
  update(deltaTime: number) {
    if (this.startPlay) {
      if (this.DateType == DataType.ByteFrequency) {
        this.analyser.getByteFrequencyData(this.u8aCache);
      } else if (this.DateType == DataType.ByteTimeDomain) {
        this.analyser.getByteTimeDomainData(this.u8aCache);
      }
      this.useView.updateView(this.u8aCache, deltaTime);
    }
  }
}
