import { Plugin, inject, defineAsyncComponent, Component, DefineComponent } from 'vue'
import usePopupStore, { type PopupConfig } from './popup'
import PopupCtrl from './PopupCtrl.vue'

declare module 'vue' {
  /** 彈窗組件 */
  function inject(key: 'popupStore'): ReturnType<typeof usePopupStore>
}

const Config: Plugin<PopupConfig> = {
  install(app, options = {}) {
    app.component('PopupCtrl', PopupCtrl)
    // 注册弹窗异步组件
    // const cmts = require.context('@cmt/popup', true, /\/.*?\.vue$/, 'lazy')
    // cmts.keys().forEach((key) => {
    //   const name = key.match(/\/([^\/]*?)\.vue$/)[1]
    //   if (!app?._context?.components[name]) {
    //     const syncCmt = defineAsyncComponent(() => cmts(key))
    //     app.component(name, syncCmt)
    //   }
    // })
    // vite注册弹窗
    let popupComponents = import.meta.glob('../popup/*.vue'/***/, { eager: false });
    for (let key in popupComponents) {
      let name = key.split('/').pop().replace('.vue', '');
      app.component(name, defineAsyncComponent(popupComponents[key]))
    }
    app.provide('popupStore', usePopupStore(options))
  },
}

// 彈窗組將擴展使用
interface PopupComponent {}

export default Config

export { usePopupStore, PopupComponent, PopupConfig }
