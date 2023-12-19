import { createApp } from './main'
import { renderToString } from 'vue/server-renderer'
export async  function render () {
  let app = createApp()
  let html = await renderToString(app)
  return html
}