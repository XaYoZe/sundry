import { createApp } from '../common/app'
import "./css/common.scss"
import "~bootstrap/scss/bootstrap.scss";
import "~bootstrapIcons/font/bootstrap-icons.scss";
import * as bootstrap from 'bootstrap'

let { app, router } = createApp();

router.isReady().then(res => {
  app.mount('#app')
})