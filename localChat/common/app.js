import { createSSRApp, defineAsyncComponent  } from 'vue';
import index from '../views/index.vue';
import createRoute from '../views/router';
import { createPinia } from 'pinia';
import usePopupStore from '../views/pinia/popup';
import piniaCachePlugin from '../views/pinia/piniaCachePlugin';

export function createApp () {
  const app = createSSRApp(index);
  const router = createRoute();
  const pinia = createPinia();
  app.use(router);
  app.provide('isSSR', import.meta.env.SSR);
  if (import.meta.env.SSR) {
    app.use(pinia);
  } else {
    app.use(pinia.use(piniaCachePlugin));
  }
  app.provide('popupStore', usePopupStore());

  // 注册弹窗
  let popupComponents = import.meta.glob('../views/components/popup/*.vue'/***/, { eager: false });
  for (let key in popupComponents) {
    let name = key.split('/').pop().replace('.vue', '');
    app.component(name, defineAsyncComponent(popupComponents[key]))
  }
  return {app, router} 
}