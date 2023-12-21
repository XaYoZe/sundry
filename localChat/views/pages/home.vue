<template>
  <div class="home">
    <div class="home_left_panel">
      <button @click="clickShowPopup">PopupCreateUser</button>
    </div>
    <div class="home_right_panel">

    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, defineAsyncComponent, computed, onBeforeMount, onServerPrefetch, onMounted } from "vue";
import useDataStore from '../pinia/data'
import usePopupStore from '../pinia/popup'
let dataStore = useDataStore();
let popupStore = usePopupStore();
let navbar = [
  { text: "首頁", component: defineAsyncComponent(() => import('@cpt/home/CurAct.vue')) },
  { text: "記錄", component: defineAsyncComponent(() => import('@cpt/home/History.vue')) },
  { text: "設置", component: defineAsyncComponent(() => import('@cpt/home/Setting.vue')) },
];
let active = ref(0);
let curPage = computed(() => {
  return navbar[active.value];
})

let data = ref(null);

let clickShowPopup = () => {
  popupStore.open('PopupCreateUser')
}
onMounted(async () => {
  if (!data.value) {
    // setTimeout(() => {
    //   data.value = {a: 1}
    // }, 2000)
  }
  // console.log(await chrome.windows.getCurrent({populate: true}))
  // console.log(await chrome.tabs.query({ active: true, lastFocusedWindow: true }))
  
})


</script>
<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  background: #eee;
  .continue {
    height: calc(100% - 56px);
    width: 100%;
    overflow: auto;
  }
}
</style>
