import { createSSRApp } from 'vue'
import index from './index.vue'

export function createApp () {
  const app = createSSRApp(index)
  return app 
}