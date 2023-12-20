<template>
  <div class="home">
    <nav class="navbar navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">{{ curPage.text }}</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasDarkNavbar"
          aria-controls="offcanvasDarkNavbar"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div
          class="offcanvas offcanvas-end text-bg-dark"
          active="-1"
          id="offcanvasDarkNavbar"
          aria-labelledby="offcanvasDarkNavbarLabel"
        >
          <div class="offcanvas-header position-relative py-1" style="height: 56px">
            <a
              href="/"
              class="d-flex align-items-center mb-md-0 me-md-auto text-white text-decoration-none"
              style="height: 40px;line-height: 40px;"
            >
              <span class="fs-4">Sidebar</span>
            </a>
            <button
              type="button"
              class="btn-close btn-close-white py-1 px-2 position-absolute"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
              style="width: 1.5em;
              font-size: 1.24rem;
              height: 1.5em;
              top: 16px;
              right: 23px;"
            ></button>
          </div>
          <div class="offcanvas-body">
            <ul class="nav nav-pills flex-column mb-auto">
              <li class="nav-item" v-for="(nav, i) in navbar" :key="i">
                <a href="#" class="nav-link text-white" :class="{active: active === i}" @click="active = i" data-bs-dismiss="offcanvas" aria-label="Close" >
                  {{ nav.text }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    <div class="continue">
      <!-- <Suspense> -->
        <component :is="curPage.component"></component>
      <!-- </Suspense> -->
    </div>
    
  </div>
  <!-- <div class="home" v-if="fas"> -->
    <!-- <div class="tab">
      <div
        class="tab_item"
        @click="active = 0"
        :class="{ active: active === 0 }"
      >
        當前
      </div>
      <div
        class="tab_item"
        @click="active = 1"
        :class="{ active: active === 1 }"
      >
        記錄
      </div>
    </div> -->
  <!-- </div> -->
</template>
<script lang="ts" setup>
import { ref, defineAsyncComponent, computed, onBeforeMount, onServerPrefetch } from "vue";
import useDataStore from '../pinia/data'
let dataStore = useDataStore();
console.log(dataStore.a)
let navbar = [
  { text: "首頁", component: defineAsyncComponent(() => import('@cpt/home/CurAct.vue')) },
  { text: "記錄", component: defineAsyncComponent(() => import('@cpt/home/History.vue')) },
  { text: "設置", component: defineAsyncComponent(() => import('@cpt/home/Setting.vue')) },
];
let active = ref(0);
let curPage = computed(() => {
  return navbar[active.value];
})

onServerPrefetch(() => {
  console.log('serverPrefetch')
})

onBeforeMount(async () => {
  // console.log(await chrome.windows.getCurrent({populate: true}))
  // console.log(await chrome.tabs.query({ active: true, lastFocusedWindow: true }))
  
})


</script>
<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  .continue {
    height: calc(100% - 56px);
    width: 100%;
    overflow: auto;
  }
}
</style>
