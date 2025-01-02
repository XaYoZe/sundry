import { DefineComponent, reactive, ref, nextTick, ComputedOptions, MethodOptions, EmitsOptions, TransitionProps, PropType, StyleValue } from 'vue'
import { PopupComponent } from './index'

let projName = 'projName';

/**
 * 彈窗配置
 */
export interface PopupConfig {
  /** 只能存在一個相同彈窗 */
  only?: boolean
  /** 動畫效果
   * - bounce: 彈跳
   * - bottom: 從底部彈起
   * - boom: 爆炸效果
   */
  anime?: 'bounce' | 'bottom' | 'boom' | 'none'
  /** 透明度 */
  opacity?: number
  /** 層級 */
  zIndex?: number
  /** 點擊遮罩關閉 */
  maskClose?: boolean
  /**
   * 外层弹窗容器类名
   */
  rootClassName?: string,
  /** 遮罩樣式 */
  maskStyle?: StyleValue
}

/** 所有彈窗組件 */
// type PopupComponent = PopupComponent
/** 所有彈窗组件名稱 */
type PopupNames = keyof PopupComponent

/** 获取vue组件参数 */
type ComponentParams<Name extends string> = Name extends keyof PopupComponent
  ? PopupComponent[Name] extends DefineComponent<
      infer P,
      infer B,
      infer D,
      infer C extends ComputedOptions,
      infer M extends MethodOptions,
      infer Mixin,
      infer Extends,
      infer E extends EmitsOptions,
      infer PublicProps,
      infer Defaults
    >
    ? {
        P: P
        B: B
        D: D
        C: C
        M: M
        Mixin: Mixin
        Extends: Extends
        E: E
        PublicProps: PublicProps
        Defaults: Defaults
      }
    : never
  : never

/** 解析字符串参数 */
type SplitParams<Str extends string> = Str extends `${infer Name}?${infer Params}` ? [Name, FormatParams<Params>] : [Str, any]
type FormatParams<Str extends string> = Str extends `${infer Param1}&${infer Param2}` ? ForamtValue<Param1> & FormatParams<Param2> : ForamtValue<Str>
type ForamtValue<Str extends string> = Str extends `${infer Name}=${infer Value}` ? { [T in Name]: Value } : { [T in Str]: true }
/** 获取组件名字 */
type FormatName<Name extends string> = SplitParams<Name>[0] extends PopupNames ? SplitParams<Name>[0] : never

/** 获取参数 */
type GetObjectParams<T, K, D = never> = K extends keyof T ? Pick<T, K>[K] : D
type GetFunctionParams<T, K = never, D = never> = T extends (...args: any[]) => any ? (K extends number ? Parameters<T>[K] : Parameters<T>) : D

/** 获取组件props */
type Props<Name extends string> = SplitParams<Name>[0] extends PopupNames
  ? `$props` extends keyof ComponentParams<SplitParams<Name>[0]>['B']
    ? {
        -readonly [T in keyof GetObjectParams<ComponentParams<SplitParams<Name>[0]>['B'], '$props'>]?: GetObjectParams<ComponentParams<SplitParams<Name>[0]>['B'], T>
      }
    : {
        [T in keyof ComponentParams<SplitParams<Name>[0]>['P']]?: GetObjectParams<ComponentParams<SplitParams<Name>[0]>['P'][T], 'type'> extends PropType<infer Type>
          ? Type
          : GetObjectParams<ComponentParams<SplitParams<Name>[0]>['P'][T], 'default'>
      }
  : Record<string, any>

/** 关闭窗口emit事件 */
type DefaultEmitEvent = {
  close: (cb: () => void, ...args: any[]) => void
}
/** 获取组件emit */
type Emits<Name extends string> = SplitParams<Name>[0] extends PopupNames
  ? `$emit` extends keyof ComponentParams<SplitParams<Name>[0]>['B']
    ? {
        [K in GetFunctionParams<ComponentParams<SplitParams<Name>[1]>['B']['$emit'], 0>]: GetObjectParams<ComponentParams<SplitParams<Name>[0]>['B'], '$emit', never>
      }
    : {
        [K in keyof ComponentParams<SplitParams<Name>[0]>['E']]: ComponentParams<SplitParams<Name>[0]>['E'][K]
      }
  : never

type ReturnPopupObject = InstanceType<typeof PopupObject>

/** 创建弹窗对象 */
class PopupObject<Name extends PopupNames> {
  /** 簡單合併兩個對象 */
  static deepMerge<T, T1>(target: T = {} as T, source: T1): T {
    for (const key in source) {
      if (source[key] instanceof Object) {
        if (!target[key as string]) Object.assign(target, { [key]: {} })
        PopupObject.deepMerge(target[key as string], source[key as string])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
    return target
  }
  show = ref(false)
  /** 彈窗id */
  id: number
  /** 弹窗名称 */
  name: Name
  /** 弹窗数据 */
  data: Props<Name>
  /** 彈窗組件 */
  ref: InstanceType<PopupComponent[Name]>
  /** disabled */
  disabled = false
  transitionConfig: TransitionProps = {}
  /** 配置 */
  option: PopupConfig = {
    maskClose: false, // 點擊遮罩關閉
    only: false, // 只能存在一個
    opacity: undefined, // 透明度
    zIndex: undefined, // 層級
    anime: 'bounce', // 動畫
    maskStyle: {}
  }
  /** 當前觸發關閉方法的索引 */
  private selfCloseIndex = -1
  /** 窗口控制方法掛載 */
  private closeCtrlFn = (any) => undefined
  private emitCloseIdFn = (any) => undefined
  /** 事件列表 **/
  event: Record<string, ((...args: any[]) => void | PromiseConstructor)[]> = {}
  eventSource: Record<string, ((...args: any[]) => void | PromiseConstructor)[]> = {}
  /**
   *
   * @param id 彈窗id
   * @param name 彈窗組件名
   * @param data 彈窗props數據
   * @param option 彈窗配置
   * @param closeCtrlFn 關閉控制方法
   * @param emitCloseIdFn 關閉事件
   */
  constructor(id: number, name: Name, props: Props<Name>, option: PopupConfig, closeCtrlFn: (any) => void, emitCloseIdFn: (any) => void) {
    this.id = id
    this.name = name
    this.option = PopupObject.deepMerge(this.option, option || {})
    this.data = props // 弹窗数据
    this.initTransitionConfig();
    this.closeCtrlFn = closeCtrlFn
    this.emitCloseIdFn = emitCloseIdFn
  }
  /** 初始化彈窗動畫參數 */
  initTransitionConfig () {
    let name = this.option.anime;
    let duration:TransitionProps['duration'] = {
      enter: 300,
      leave: 300
    };
    if (name === 'boom') {
      duration.enter = 850;
    } else if (name === 'none') {
      duration.enter = 0;
      duration.leave = 0;
    }
    
    this.transitionConfig = {
      name,
      duration
    }
  }
  /**
   * 註冊監聽$emit事件, 返回promise
   * @param event 事件名
   * @returns { Promise } 彈窗對象
   */
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof Emits<Name> | EventType
  ): Promise<GetFunctionParams<GetObjectParams<DefaultEmitEvent, EventType, GetObjectParams<Emits<Name>, EventType, (...args: any[]) => void>>, 0, any>>
  /**
   * 註冊監聽$emit事件, 觸發在組件上使用$emit('事件名')觸發事件
   * @param event 事件名
   * @param callback 事件回調
   * @returns { PopupObject } 彈窗對象
   */
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof Emits<Name> | EventType,
    callback: GetObjectParams<DefaultEmitEvent, EventType, GetObjectParams<Emits<Name>, EventType, (...args: any[]) => void>>
  ): typeof this
  on<EventType extends string>(
    event: keyof DefaultEmitEvent | keyof Emits<Name> | EventType,
    callback?: GetObjectParams<DefaultEmitEvent, EventType, GetObjectParams<Emits<Name>, EventType, (...args: any[]) => void>>
  ) {
    // 添加事件
    this.event[event as string] || (this.event[event as string] = [])
    this.eventSource[event as string] || (this.eventSource[event as string] = [])
    const eventIndex = this.eventSource[event as string].length
    // 沒有傳入回調返回promise
    if (typeof callback !== 'function') {
      let resolve = null
      let reject = null
      return new Promise((res, rej) => {
        resolve = res
        reject = rej
        if (event === 'close') {
          // 將窗口關閉方法作為參數傳入
          this.event[event as string].push((...args) => {
            this.selfCloseIndex = eventIndex
            this.emitCloseIdFn(this.id)
            resolve()
            // (callback as () => void).call(this, this.closeCtrlFn, ...args);
            this.emitCloseIdFn(-1)
          })
        } else {
          let fulfilled = false
          this.event['close'].push((...args) => {
            this.selfCloseIndex = eventIndex
            this.emitCloseIdFn(this.id)
            if (fulfilled) {
              this.closeCtrlFn.call(this, this.id)
            } else {
              fulfilled = true
              reject(this.closeCtrlFn.bind(this, this.id))
            }
            this.emitCloseIdFn(-1)
          })
          this.event[event as string].push((...args) => {
            fulfilled = true
            resolve(...args)
          })
        }
      })
    }
    if (event === 'close') {
      // 將窗口關閉方法作為參數傳入
      this.event[event as string].push((...args) => {
        this.selfCloseIndex = eventIndex
        this.emitCloseIdFn(this.id)
        ;(callback as () => void).call(this, this.closeCtrlFn, ...args)
        this.emitCloseIdFn(-1)
      })
    } else {
      this.event[event as string].push(callback as () => void)
    }
    this.eventSource[event as string].push(callback as () => void)
    return this
  }
  /**
   * 解綁監聽$emit事件
   * @param event 事件名
   * @param callback 註冊事件時使用的函數
   * @returns { PopupObject } 彈窗對象
   */
  un<EventType extends string>(event: keyof DefaultEmitEvent | keyof Emits<Name> | EventType, func) {
    let index = this.eventSource[event as string].indexOf(func)
    if (index > -1) {
      this.event[event as string].splice(index, 1)
      this.eventSource[event as string].splice(index, 1)
    }
    return this
  }
  /**
   * 獲取組件實例
   * @param el 組件
   * @returns this
   */
  onRef = (el) => {
    this.ref = el
    return this
  }
  /** 手動關閉窗口 */
  close = (...args) => {
    /** 在close方法內調用處理 */
    if (this.selfCloseIndex > -1) {
      this.closeCtrlFn.call(this, this.id, ...args)
    } else {
      this.event['close'].forEach((fn, i) => {
        fn.call(this, ...args)
      })
    }
  }
  /** 
   * 傳組件數據
   * @param {Props<Name>} props 組件數據
   */
  props (props: Props<Name>) {
    this.data = props // 弹窗数据
    return this
  }
  /** 
   * 設置彈窗配置
   * @param {PopupConfig} config 彈窗配置
   */
  config (config: PopupConfig) {
    this.option = PopupObject.deepMerge(this.option, config || {});
    this.initTransitionConfig();
    return this
  }
}

type ToastConfig = {
  /** 持續時間 */
  duration?: number
}
/** toast */
class ToastObject {
  id: number
  /** 显示文本 */
  text = ''
  /** 配置 */
  option: ToastConfig = {
    /** 持續時間 */
    duration: 3000,
  }
  timer = null
  /** 窗口控制方法掛載 */
  private closeCtrlFn = (any) => undefined
  constructor(id: number, text: string, option: ToastConfig | number = {}, addCloseCtrlFn) {
    this.id = id
    this.text = text
    this.closeCtrlFn = addCloseCtrlFn
    // 只傳入數字則為持續時間
    if (typeof option === 'number') {
      this.option = PopupObject.deepMerge(this.option, { duration: option })
    } else {
      this.option = PopupObject.deepMerge(this.option, option || {})
    }
  }
  /** 手動關閉窗口 */
  close = () => {
    clearTimeout(this.timer)
    this.closeCtrlFn(this.id)
  }
  /** 开始计时 */
  start() {
    // 固定時長後自動關閉
    this.timer = setTimeout(() => {
      this.close()
    }, this.option.duration)
  }
}

function createPopupStore() {
  const popupIndex = ref(1)
  const popupList: ReturnPopupObject[] = reactive([])
  const toastList: Array<ToastObject> = reactive([])
  // 當前正在關閉的彈窗id
  const currentCloseId = ref(-1)
  /** 緩存數據 */
  let dataCache = null;
  /** 緩存配置 */
  let configCache = null;

  /**
   * 創建彈窗對象
   * @param popupName 彈窗名, 需要對應組件名
   * @param popupData 彈窗數據, 在組件中使用props獲取
   * @param popupConfig 彈窗配置
   * @returns 彈窗對象
   */
  function createPopup<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}, show = true): PopupObject<FormatName<Name>> {
    let configClone = PopupObject.deepMerge({}, this.popupConfig);
    if (configCache) {
      configClone = PopupObject.deepMerge(configClone, configCache);
      configCache = null;
    }
    if (dataCache) {
      popupData = PopupObject.deepMerge(dataCache, popupData);
      dataCache = null;
    }
    popupConfig = PopupObject.deepMerge(configClone, popupConfig);
    // if (!popupName) return '';
    const popupId = popupIndex.value++
    const query: SplitParams<typeof popupName>[1] = {}
    let name: SplitParams<typeof popupName>[0] = popupName
    // 彈窗名後面拼參數
    if (name.indexOf('?') > -1) {
      let search = ''
      ;[name, search] = String(popupName).split('?')
      search.split('&').forEach((item) => {
        const [key, value] = item.split('=')
        query[key] = value || true
      })
    }
    // 配置了只能存在一個同名彈窗
    if (popupConfig?.only) {
      const [popup] = popupList.filter((popup) => popup.name === name)
      if (popup) {
        return popup as PopupObject<FormatName<Name>>
      }
    }
    // 創建窗口對象
    const popupObject = new PopupObject(popupId, name as PopupNames, PopupObject.deepMerge(popupData, query), popupConfig, close.bind(this), (id) => {
      currentCloseId.value = id
    })
    // 默認關閉窗口事件
    popupObject.on('close', () => {
      /** 沒有其它關閉事件才觸發 */
      if (popupObject.event.close.length === 1) {
        close(popupObject.id)
      }
    })
    popupObject.disabled = !show
    if (show) {
      setTimeout(() => {
        popupList.push(popupObject);
        nextTick(() => {
          popupObject.show.value = true;
          // (popupObject.show.value as any) = true;
        })
      })
    }
    return popupObject
  }

  /**
   * 打開彈窗
   * @param popupName 彈窗組件名
   * @param popupData 數據, 組件內使用defineProps獲取
   * @param popupConfig 配置
   * @returns {PopupObject} 彈窗對象
   */
  function open<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}): PopupObject<FormatName<Name>> {
    return createPopup.call(this, popupName, popupData, popupConfig)
  }
  // function open <Name extends PopupNames>(popupName: Name, popupData?: Props<Name> , popupConfig: PopupConfig = {}, show = true):PopupObject<number, Name> {
  //   return createPopup.call(this, popupName, popupData, popupConfig, show)
  // }

  /** 只能存在一個 */
  function only<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}): PopupObject<FormatName<Name>> {
    return createPopup.call(this, popupName, popupData, PopupObject.deepMerge(popupConfig, { only: true }))
  }

  /**
   * 每日彈窗彈一次, 使用$emit('close', true)控制是否再能再次觸發
   * @param popupName 彈窗組件名
   * @param popupData 數據, 組件內使用defineProps獲取
   * @param popupConfig 配置
   * @returns {PopupObject} 彈窗對象
   */
  function daily<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}): PopupObject<FormatName<Name>> {
    const storeName = `${projName}_${popupName}_daily_open_time`
    const prevDayTime = localStorage.getItem(storeName) || 0
    const curDayTime = new Date().setHours(0, 0, 0, 0)
    // 超過今天0點
    return createPopup.call(this, popupName, popupData, popupConfig, curDayTime > Number(prevDayTime)).on('close', (cb, val) => {
      if (val) {
        localStorage.removeItem(storeName)
      } else {
        localStorage.setItem(storeName, curDayTime.toString())
      }
      cb()
    })
  }

  /**
   * 活動只彈一次, 使用$emit('close', true)控制是否再能再次觸發, 如果需要id區分將id拼在彈窗名字後面裡 popupName?id=111
   * @param popupName 彈窗組件名
   * @param popupData 數據, 組件內使用defineProps獲取
   * @param popupConfig 配置
   * @returns {PopupObject} 彈窗對象
   */
  function once<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}): PopupObject<FormatName<Name>> {
    const storeName = `${projName}_${popupName}_once`
    const storeVal = localStorage.getItem(storeName)
    // 超過今天0點
    // localStorage.setItem(storeName, '1');
    return createPopup.call(this, popupName, popupData, popupConfig, !Boolean(Number(storeVal))).on('close', (cb, val) => {
      if (val) {
        localStorage.removeItem(storeName)
      } else {
        localStorage.setItem(storeName, '1')
      }
      cb()
    })
  }

  /** 從底部彈起 */
  function bottom<Name extends string>(popupName: Name | PopupNames, popupData?: Props<Name>, popupConfig: PopupConfig = {}): PopupObject<FormatName<Name>> {
    return createPopup.call(this, popupName, popupData, Object.assign(popupConfig, { anime: 'bottom' }))
  }

  /** 關閉彈窗 */
  function close(id = currentCloseId.value): ReturnPopupObject | null {
    let popup: ReturnPopupObject = null
    // 沒有傳id關閉最後一個
    if (id === -1) {
      popupList[popupList.length - 1]?.close()
      // [popup] = popupList.splice(-1, 1)
    } else {
      const index = popupList.findIndex((popup) => popup.id === id)
      if (index > -1) {
        console.log(popupList[index].show);
        popup = popupList[index];
        (popup.show as any) = false;
        nextTick(() => {
          popupList.splice(index, 1)
        })
      }
    }
    return popup
  }

  /**
   * toast
   * @param text 文本
   * @param config 配置 時長
   */
  function toast(text: string, config: ToastConfig | number = null): ToastObject {
    const toastId = popupIndex.value++
    const toastObject = new ToastObject(toastId, text, config, () => {
      const index = toastList.findIndex((toastObj) => toastObj.id === toastId)
      if (index > -1) {
        return toastList.splice(index, 1)
      }
    })
    toastList.push(toastObject)
    toastObject.start()
    return toastObject
  }

  
  /** 
   * 傳組件數據
   * @param {Props<any>} props 組件數據
   */
  function props (props: Props<any>):ReturnType<typeof usePopupStore> {
    dataCache = props // 弹窗数据
    return this
  }
  
  /** 
   * 設置彈窗配置
   * @param {PopupConfig} config 彈窗配置
   */
  function config (config: PopupConfig):ReturnType<typeof usePopupStore> {
    configCache = config
    return this
  }

  function usePopupStore(popupConfig: PopupConfig = {}) {
    return {
      popupConfig,
      popupList,
      toastList,
      open,
      only,
      daily,
      once,
      bottom,
      close,
      toast,
      props,
      config,
    }
  }
  
  /** 
   * popupStore
   * @params config store默認彈窗配置
   */
  return usePopupStore
}

export default createPopupStore()
