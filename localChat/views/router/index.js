import { defineAsyncComponent } from "vue";
import { createRouter, createMemoryHistory, createWebHistory } from "vue-router";

let pages = import.meta.glob(`../pages/*.vue`, { eager: false }); // */

export default () => {
  let routesList = [];
  for (let key in pages) {
    let name = key.split("/").slice(-1)[0].replace(".vue", "");
    let component = defineAsyncComponent(pages[key]);
    routesList.push({
      path: `/${name}`,
      name,
      component,
    });
  }
  let router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [...routesList, { path: "/:pathMatch(.*)*", component: routesList[0].component }],
  });
  return router
};
