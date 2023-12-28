import { defineAsyncComponent } from "vue";
import { createRouter, createMemoryHistory, createWebHistory } from "vue-router";

let pages = import.meta.glob(`../pages/*.vue`, { eager: false }); // */
export default () => {
  let routes = [];
  for (let key in pages) {
    let name = key.split("/").slice(-1)[0].replace(".vue", "");
    let component = pages[key];
    routes.push({
      path: `/${name}`,
      name,
      component,
    });
    if (name === 'home') {
      routes.push({ path: "/:pathMatch(.*)*", component })
    }
  }
  let router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
  });
  return router
};
