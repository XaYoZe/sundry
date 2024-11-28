import "@style/common.scss";
import { createApp } from 'vue';
import index from '../views/index.vue';
import createRoute from '../views/router';
import { createPinia } from 'pinia';
import PopupStore from '../views/components/PopupCtrl/index';
import DataStore from '../views/pinia/data';
import piniaCachePlugin from '../views/pinia/piniaCachePlugin';

const app = createApp(index);
const router = createRoute();
const pinia = createPinia();
app.use(router);
app.use(PopupStore);
app.provide('isSSR', import.meta.env.SSR);
app.use(pinia);
app.use(pinia.use(piniaCachePlugin));
app.provide('dataStore', DataStore());
app.mount('#app');