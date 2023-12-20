import { createSSRApp } from 'vue'
import index from '../src/index.vue'
import createRoute from '../src/router'
import { createPinia } from 'pinia'
import piniaCachePlugin from '../src/pinia/piniaCachePlugin'

export function createApp () {
  const app = createSSRApp(index);
  const router = createRoute();
  const pinia = createPinia()
  app.use(router)
  if (import.meta.env.SSR) {
    app.use(pinia)
  } else {
    app.use(pinia.use(piniaCachePlugin))
  }
  return {app, router} 
}