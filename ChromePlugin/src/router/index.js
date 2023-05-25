import { createRouter, createWebHashHistory } from 'vue-router';
import home from '../pages/home.vue';
import popup from '../pages/popup.vue';

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: '/',
      component: home
    },
    {
      path: '/popup',
      name: '/popup',
      component: popup
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ]
})