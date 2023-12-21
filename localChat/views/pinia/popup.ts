import { defineStore } from 'pinia'
interface Popup {
  id: number // 彈窗id
  name: string // 弹窗名称
  onlyOne?: boolean // 只能存在一個相同彈窗
  data?: object // 弹窗数据
  event?: object // 事件
}
interface State {
  popupId: number // 彈窗id變量
  popupList: Array<Popup> // 彈窗列表
}

export default defineStore('popup', {
  state: (): State => ({
    popupId: 1,
    popupList: []
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
  },
})
