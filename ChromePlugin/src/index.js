import { createApp } from 'vue'
import router from './router';
import index from './index.vue'
import "./css/common.scss"
import "~bootstrap/scss/bootstrap.scss";
import * as bootstrap from 'bootstrap'

let app = createApp(index);
app.use(router)
app.mount('#app')
