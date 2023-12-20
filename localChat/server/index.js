import { createApp } from '../common/app'
import { renderToString } from 'vue/server-renderer'

export async function render (url) {
  let { app, router } = createApp()
  let name = url.slice(1);
  if (name !=='' && !router.hasRoute(name)) {
    return Promise.reject('not-router')
  }
  await router.push(url)
  await router.isReady()
  const ctx = {}
  let html = await renderToString(app, ctx)
  return [html]
}