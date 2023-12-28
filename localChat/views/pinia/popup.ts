import { defineStore } from 'pinia'
import "@style/common.scss";
import { reactive } from 'vue'
interface Popup {
  id: number // 彈窗id
  name: string // 弹窗名称
  onlyOne?: boolean // 只能存在一個相同彈窗
  data?: object // 弹窗数据
  event?: object // 事件
}

interface EventFunction {
  [key: string]: Function
}
export interface Tip {
  id: number,
  duration: number,
  onlyOne?: boolean // 同一時間存在一個相同彈窗 
  text: string, // 弹窗数据
  event: EventFunction, // 上一个弹窗
  show: boolean
  type: string
}
interface State {
  popupId: number // 彈窗id變量
  popupList: Array<Popup> // 彈窗列表
  tipId: number
  tipList: Array<Tip>
}

export default defineStore('popup', {
  state: (): State => ({
    popupId: 1,
    popupList: [],
    tipId: 1,
    tipList: [],
  }),
  actions: {
    // 打開彈窗
    open(config: string | Popup) {
      if (typeof config === 'string' || typeof config === 'object') {
        if (typeof config === 'object' && config.onlyOne && this.popupList.some((popup) => popup.name === config.name)) {
          return
        }
        let newPopup: Popup = {
          id: this.popupId++,
          onlyOne: false,
          name: '', // 弹窗名称
          data: {}, // 弹窗数据
          event: {}, // 上一个弹窗
        }
        if (typeof config === 'string') {
          newPopup.name = config
        } else if (typeof config === 'object') {
          newPopup = Object.assign(newPopup, config)
        }
        this.popupList.push(newPopup)
        console.log(this.popupList, newPopup)
      }
    },
    // 關閉彈窗
    close(id: number = -1) {
      let index = this.popupList.findIndex((popup) => popup.id === id) || 0
      this.popupList.splice(index, 1)
    },
    // 獲取彈窗數據
    data(id: number): Popup {
      let index = this.popupList.findIndex((popup) => popup.id === id)
      return this.popupList[index]
    },
    tip (config: string | Tip) {
      if (typeof config === 'string' || typeof config === 'object') {
        if (typeof config === 'object' && config.onlyOne && this.tipList.some((tip) => config === tip.text || tip.text === config.text)) {
          return
        }
        let newTip: Tip = reactive({
          id: this.tipId++,
          duration: 3000,
          text: '', // 弹窗数据
          event: {}, // 上一个弹窗
          show: true,
          type: ''
        })
        if (typeof config === 'string') {
          newTip.text = config
        } else if (typeof config === 'object') {
          newTip = Object.assign(newTip, config)
        }
        this.tipList.push(newTip);
        setTimeout(() => {
          newTip.show = false;
          setTimeout(() => {
            let index = this.tipList.findIndex((tip) => tip.id === newTip.id) || 0
            this.tipList.splice(index, 1);
          }, 500)
        }, newTip.duration)
        console.log(this.tipList, newTip)
      }
    },
    closeTip (id: number = -1) {
      
    }
  },
})
