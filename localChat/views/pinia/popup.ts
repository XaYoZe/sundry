import { defineStore } from 'pinia'
import type { Store } from 'pinia'



/**
 * 彈窗配置
 */
interface PopupConfig {
  /** 只能存在一個相同彈窗 */
  onlyOne?: boolean
  /** 動畫效果 */
  anime?: 'bounce' | 'bottom',
  /** 透明度 */
  opacity?: number
  /** 層級 */
  zIndex?: number 
}

/** 彈窗 */
interface Popup {
  /** 彈窗id */
  id?: number
  /** 弹窗名称 */
  name?: string
  /** 弹窗数据 */
  data?: object
  /** 事件列表 在彈窗對象上使用'on事件名'即可註冊, 觸發在組件上使用$emit('事件名')觸發事件,小寫開頭 */
  event?: object
  /** 配置 */
  option?: PopupConfig,
  /** 關閉窗口 */
  close: () => void
}


/** 彈窗 */
interface Toast {
  /** 彈窗id */
  id?: number
  /** 弹窗文案 */
  text?: string
  type: '' | 'success' | 'waring' | 'error',
  /** 配置 */
  option?: {
    /** 持續時間 */
    duration?: number
  }
}

const popupStore = defineStore('popup', {
  state: (): {
    /** 彈窗id */
    popupId: number
    /** 彈窗列表 */
    popupList: Array<Popup>
    toastList: Array<Toast>
  } => ({
    popupId: 1,
    popupList: [],
    toastList: [],
  }),
  actions: {
    /**
     * 創建彈窗對象
     * @param popupName 彈窗名, 需要對應組件名
     * @param popupData 彈窗數據, 在組件中使用props獲取
     * @param popupConfig 痰喘配置
     * @returns 彈窗對象
     */
    createPopup (popupName: string, popupData:object = {}, popupConfig:PopupConfig):Popup {
      let popupId = this.popupId++;
      let popupObj:Popup = {
        id: popupId,
        name: popupName, // 弹窗名称
        option: Object.assign({
          onlyOne: false, // 只能存在一個
          opacity: undefined, // 透明度
          zIndex: undefined, // 層級
          anime: 'bounce', // 動畫
        }, popupConfig),
        data: popupData, // 弹窗数据
        event: {}, // 事件
        close: () => { // 關閉窗口
          this.close(popupId)
        }
      }
      let popupProxy = new Proxy(popupObj, {
        get(target, p, receiver): Popup | Function {
          // 返回原有值
          if (target[p]) {
            return target[p]
          }
          /** 註冊事件 
          註冊方式 on + 事件名, 例: popup.open('popupName').onToggle(() => {})
          觸發方式 popupName組件內 $emit觸發事件 $emit('toggle', data);
          注: 註冊事件名on開頭,觸發事件不需要on小寫開頭
          **/
          if (/^on/.test(String(p))) {
            let eventName = String(p).slice(2).replace(/^(.)/, (val) => val.toLowerCase());
            return (fn) => {
              target.event[eventName] = fn.bind(receiver);
              return receiver
            };
          }
          return
        },
      })
      if (!(popupConfig.onlyOne && this.popupList.some((popup) => popup.name === popupName))) {
        this.popupList.push(popupProxy)
      }
      return popupProxy
    },
    /** 打開彈窗 */
    open(popupName: string, popupData:object = {}, popupConfig: PopupConfig = {}):Popup | undefined {
      if (popupName) {
        let newPopup: Popup = this.createPopup(popupName, popupData, popupConfig)
        return newPopup
      }
    },
    /** 從底部彈起 */
    bottom (popupName: string, popupData:object = {}, popupConfig: PopupConfig = {}):Popup | undefined {
      return this.open(popupName, popupData, Object.assign(popupConfig, {anime: 'bottom'}))
    },
    /** 關閉彈窗 */
    close(id: Popup['id'] = -1): Popup | boolean {
      // 沒有傳id關閉最後一個
      if (id === -1) {
        return this.popupList.splice(-1, 1)
      }
      // 有id且能找到窗口
      let index = this.popupList.findIndex((popup) => popup.id === id);
      if (id > -1 && index > -1) {
        return this.popupList.splice(index, 1)
      }
      return false
    },
    /**
     * toast
     * @param text 文本
     * @param config 配置 時長
     */
    toast (text, config) {
      let popupId = this.popupId++;
      let toastConfig = Object.assign({
        duration: 3000
      }, isNaN(config) ? config : {duration: config})
      let toastObj:Toast = {
        id: popupId,
        type: '',
        text: text, // 弹窗名称
        option: toastConfig,
      }
      this.toastList.push(toastObj);
      // 固定時長後自動關閉
      setTimeout(() => {
        let index = this.toastList.findIndex((toastObj) => toastObj.id === popupId);
        if (index > -1) {
          return this.toastList.splice(index, 1)
        }
      }, toastObj.option.duration)
    },
    /** 獲取彈窗數據 */
    data(id: number): Popup | null {
      let index = this.popupList.findIndex((popup) => popup.id === id)
      return index > -1 ?  this.popupList[index] : null
    },
  },
})

export default popupStore

export type PopupStore = ReturnType<typeof popupStore>;;

declare module 'vue' {
  function inject(key: 'popupStore'): PopupStore;
}