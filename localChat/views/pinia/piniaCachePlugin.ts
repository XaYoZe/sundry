import { watch } from 'vue'
import { PiniaPluginContext } from 'pinia'


/**
 * pinia緩存插件
 * 用于缓存state里面的数据
 * 使用方法 
 * 引入插件
 * import piniaCachePlugin from './piniaCachePlugin'
 * // 可以PiniaCachePulgin(opt)傳入opt配置
 * pinia.use(PiniaCachePulgin)
 * // 在pinia文件 defineStore 中加入 cache: true
 * defineStore('data', {
      cache: true,
      ...
    })
 * 詳細配置見下方
 */

/**
 * 插件配置
 */
type PluginConfig = {
  /**
   * 設置緩存有效期 默認15天
   */
  validTime?:number;
  /**
   * 延遲保存修改, 防止頻繁觸發 默認500ms
   */
  delay?:number
  /**
   * 開啟調試
   */
  debug?:boolean
}

/**
 * pinia緩存配置
 */
type PiniaCacheConfig = {
  /**
   * 指定緩存
   */
  includes: Array<string>,
  /**
   * 排除緩存
   */
  excludes: Array<string>,
  /**
   *  延遲更新localStorage, 防止頻繁觸發,默認500ms
   */
  delay: number,
  /**
   * 緩存所有,會排除不緩存的值
   */
  all: boolean
  /**
   * 開啟調試,默認false
   */
  debug?:boolean
  /**
   * 深度監聽,默認false
   */
  deep?:boolean
}

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    /**
    * 開啟pinia緩存，填写true缓存所有state，string[]缓存指定state
    */
    cache?: boolean|string[]|PiniaCacheConfig
  }
}

type PiniaCacheStoreData = {
  [key in string]: any
}

// 每個pinia單獨處理
class PiniaCacheItem {
  name: string;
  store: PiniaPluginContext['store'];
  options: PiniaPluginContext['options'];
  rootStore: PiniaCacheStoreData;
  activeStore:object = {};
  delaySaveTimer;
  piniaConfig: PiniaCacheConfig = {
    includes: [],
    excludes: [],
    delay: 1000,
    all: false,
    deep: false,
  }
  changeEventList: Function[] = [];

  constructor ({store, options}: PiniaPluginContext, rootStore:PiniaCacheStoreData) {
    this.store = store;
    this.options = options;
    this.rootStore = rootStore;
    let piniaConfig = options.cache;
    if (piniaConfig) {
      this.initPiniaData(piniaConfig);
      this.loadPiniaCacheData();
      this.watchPiniaChange()
    }
  }
  // 初始化  
  initPiniaData (piniaConfig) {
    switch (piniaConfig.constructor.name) {
      case 'Array':
        this.piniaConfig.includes = piniaConfig as string[];
        break
      case 'Boolean':
        this.piniaConfig.all = piniaConfig as boolean;
        break;
      case 'Object':
        // this.piniaConfig = piniaConfig as PiniaCacheConfig;
        this.piniaConfig.includes = (piniaConfig as PiniaCacheConfig)?.includes || this.piniaConfig.includes;
        this.piniaConfig.excludes = (piniaConfig as PiniaCacheConfig)?.excludes || this.piniaConfig.excludes;
        this.piniaConfig.delay = (piniaConfig as PiniaCacheConfig)?.delay || this.piniaConfig.delay;
        this.piniaConfig.debug =  (piniaConfig as PiniaCacheConfig)?.debug || false;
        if (!piniaConfig.includes) {
          this.piniaConfig.all = true;
        }
        break;
      default:
      break;
    }
    this.piniaConfig.debug && console.log('%c%s','color:skyblue', PiniaCacheItem.name, this.store.$id, `初始化配置`, this.piniaConfig);
    for (let key in this.rootStore[this.store.$id]) {
      // 跳過不需要緩存的
      if (this.piniaConfig.excludes.includes(key)) {
        continue
      }
      if (this.piniaConfig.all || this.piniaConfig.includes.includes(key)) {
        this.activeStore[key] = this.rootStore[this.store.$id][key]
      }
    }
  }
  // 加載緩存數據
  loadPiniaCacheData () {
    this.piniaConfig.debug && console.log('%c%s','color:skyblue', PiniaCacheItem.name, this.store.$id, `加載緩存`, this.activeStore);
    this.store.$patch(this.activeStore) // this.store.$state[key]
    for (const key in this.store.$state) {
      // if (this.piniaConfig.includes.includes(key)) {}
    }
  }
  // 觸發緩存修改
  onPiniaChanged () {
    clearTimeout(this.delaySaveTimer);
    this.delaySaveTimer = setTimeout(() => {
      this.changeEventList.forEach((fn) => {
        fn(this.store.$id, this.activeStore)
      })
    }, this.piniaConfig.delay);
  }
  // 綁定修改事件
  onChange (fn) {
    this.changeEventList.push(fn);
  }
  // 監聽修改
  watchPiniaChange () {
    if (this.piniaConfig.debug) {
      console.log('%c%s','color:skyblue', PiniaCacheItem.name, this.store.$id, `設置監聽`);
    }
    
    for (let key in this.store.$state) {
      // 跳過不需要緩存的
      if (this.piniaConfig.excludes.includes(key)) {
        delete this.activeStore[key]
        continue
      }
      if (this.piniaConfig.all || this.piniaConfig.includes.includes(key)) {
        watch((() => this.store.$state[key]), (nVal, oVal) => {
          this.activeStore[key] = nVal
          this.onPiniaChanged();
          this.piniaConfig.debug && console.log('%c%s','color:skyblue', PiniaCacheItem.name, this.store.$id, `值變化${key}`, nVal);
        }, {deep: this.piniaConfig.deep})
      } else {
        delete this.activeStore[key]
      }
    }
  }
}


// 项目名
const projName = 'localChat';
// 插件
class PiniaCachePulgin {
  static app: PiniaCachePulgin;
  // 掛載
  static create(opt:PluginConfig|PiniaPluginContext) {
    if (!PiniaCachePulgin.app) {
      PiniaCachePulgin.app = new PiniaCachePulgin(opt);
    }
    if ('store'in opt && opt.store && opt.options) {
      return PiniaCachePulgin.app.install.call(PiniaCachePulgin.app, opt)
    }
    return PiniaCachePulgin.app.install.bind(PiniaCachePulgin.app)
  }
  pluginConfig:PluginConfig = {
    validTime:  15 * 24 * 60 * 60 * 1000, // 有效期15天;
    delay: 500, // 觸發保存後延遲500ms, 防止頻繁觸發
    debug: false, // 調試打印
  };
  storeName = `piniaCache_${projName}`; // pinia id
  storeData; // pinia數據
  setDataTimer; // 延遲保存數據定時器
  constructor (opt)  {
    this.pluginConfig.validTime = opt.validTime || this.pluginConfig.validTime;
    this.pluginConfig.delay = opt.delay || this.pluginConfig.delay;
    this.pluginConfig.debug = opt.debug || this.pluginConfig.debug;
    PiniaCachePulgin.clearTimeoutCache(this.pluginConfig.debug);
  }
  // pinia插件安裝
  install (context: PiniaPluginContext) {
    this.initStoreData()
    if (this.pluginConfig.debug) {
      console.log('%c%s','color:blue', PiniaCachePulgin.name, `緩存配置: ${context.store.$id}`, context.options.cache);
    }
    let piniaCacheItem = new PiniaCacheItem(context, this.storeData)
    piniaCacheItem.onChange((key, data) => {
      if (this.pluginConfig.debug) {
        console.log('%c%s','color:blue', PiniaCachePulgin.name, key, `state變化:`, data);
      }
      this.storeData[key] = data;
      this.saveStoreCacheData()
    })
  }
  // 清除超过有效期的pinia缓存
  static clearTimeoutCache(isDebug) {
    let index = 0
    let piniaCacheNamereg = /^piniaCache_/
    let deleteTimeReg = /\"deleteTime\":([0-9]+)\b/;
    let nowTime = new Date().getTime()
    let keyName;
    while ((keyName = localStorage.key(index++))) {
      if (piniaCacheNamereg.test(keyName)) {
        let deleteTime = Number(localStorage[keyName].match(deleteTimeReg)?.[1] || 0)
        // 超过有效期
        if (deleteTime < nowTime) {
          if (isDebug) {
            let cacheTime = Number(localStorage[keyName].match(/\"cacheTime\":([0-9]+)\b/)?.[1] || 0);
            console.log('%c%s','color:blue', PiniaCachePulgin.name,  `清除失效缓存: ${keyName}`, `有效期: ${ new Date(cacheTime).toLocaleString() }-${new Date(deleteTime).toLocaleString()}`);
          }
          localStorage.removeItem(keyName)
        }
      }
    }
  }
  // 保存數據到localStorage
  saveStoreCacheData() {
    clearTimeout(this.setDataTimer)
    this.setDataTimer = setTimeout(() => {
      this.storeData.cacheTime = new Date().getTime();
      this.storeData.deleteTime = this.storeData.cacheTime + this.pluginConfig.validTime;
      localStorage.setItem(this.storeName, JSON.stringify(this.storeData))
      if (this.pluginConfig.debug) {
        console.log('%c%s','color:blue', PiniaCachePulgin.name,  `更新緩存: ${this.storeName}`,  `有效期: ${ new Date(this.storeData.cacheTime).toLocaleString() }-${new Date(this.storeData.deleteTime).toLocaleString()}`);
      }
    }, this.pluginConfig.delay)
  }
  // 初始化localStorage缓存數據
  initStoreData() {
    // 初始化pinia缓存
    if (!this.storeData) {
      let storeData = JSON.parse(localStorage.getItem(this.storeName)  || JSON.stringify({"deleteTime": Date.now()}));
      this.storeData = storeData;
      if (this.pluginConfig.debug) {
        console.log('%c%s','color:blue', PiniaCachePulgin.name,  `讀取緩存`,  this.storeData);
      }
    }
    return this.storeData
  }
}

export default PiniaCachePulgin.create
