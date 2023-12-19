import { createApp } from './main'
import router from './router'
import "./css/common.scss"
import "~bootstrap/scss/bootstrap.scss";
import "~bootstrapIcons/font/bootstrap-icons.scss";
import * as bootstrap from 'bootstrap'

let app = createApp();
app.use(router)
app.mount('#app')