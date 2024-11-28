<template>
  <div class="home">
    <div class="home_left_panel" >
      <div class="logo"></div>
      <div class="user_info">
        <div class="user_icon"></div>
        <div class="user_name">
          <p>衝衝衝</p>
          <p>1</p>
        </div>
        <div class="setting">
          <Cog6ToothIcon class="custom-class"></Cog6ToothIcon>
        </div>
      </div>
      <div class="module_group">
        <Search></Search>
        <ChatGroup></ChatGroup>
      </div>
      <div class="home_tab">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
    <div class="home_right_panel">
      <ChatLog></ChatLog>
      <ChatCtrl></ChatCtrl>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject, defineAsyncComponent, computed, onBeforeMount, onServerPrefetch, onMounted, reactive } from "vue";
import { Cog6ToothIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
// import IconSwitch from '../components/common/IconSwitch.vue'

import { getUrlParam } from '@js/common'
import ChatGroup from '../components/home/ChatGroup.vue'
import Search from '../components/home/Search.vue'

import ChatLog from '../components/home/ChatLog.vue'
import ChatCtrl from '../components/home/ChatCtrl.vue'
import useDataStore from '@pinia/data'
import apiCall, { socket } from '@js/apiCall';

onBeforeMount(() => {
  // apiCall.getData({"id": 100143}).then(res => {
  //   console.log(res);
  // })
});


let dataStore = useDataStore();
let popupStore = inject('popupStore');


let active = ref(0);

let group = reactive([
  { name: "群聯1", list: Array.from(Array(20), (_, i) => i), open: false },
  { name: "好友", list: Array.from(Array(20), (_, i) => i), open: false }
]);

let data = ref(null);


let offer  = getUrlParam('offer');
let uuid  = getUrlParam('uuid');
let candidate = getUrlParam('candidate');

onMounted(async () => {
  if (offer && candidate) {
    dataStore.createSender(JSON.parse(offer), JSON.parse(candidate), uuid)
  } else {
    popupStore.open('PopupLink');
  }
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
  display: flex;
  .home_left_panel {
    height: 100%;
    width: 0;
    width: 300px;
    // background: #fff;
    .user_info {
      width: 100%;
      height: 100px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      .user_icon {
        width: 50px;
        height: 50px;
        background: #ba3;
      }
      .user_name {
        color: #666;
        margin-left: 20px;
        line-height: 20px;
      }
      .setting {
        width: 24px;
        height: 24px;
        margin-left: auto;
      }
      background: rgb(245, 233, 140);
    }
    .module_group {
      height: calc(100% - 150px);
      overflow: auto;
      display: flex;
      flex-direction: column;
      position: relative;
      // border-top: 1px solid #8888;
      // .group_table {
      //   display: flex;
      //   align-items: center;
      //   justify-content: start;
      //   padding: 0 20px;
      //   height: 32px;
      //   font-size: 18px;
      //   background: #eee8;
      //   &.open {
          
      //   }
      //   svg {
      //     height: 20px;
      //   }
      //   .group_icon  {
      //     margin-right: 5px;
      //   }
      //   .switch_icon {
      //     margin-left: auto;
      //   }
      // }
    }
    .home_tab {
      height: 50px;
      width: 100%;
      display: flex;
      > div {
        flex: 1;
        background: #ba34;
        border: 1px solid #abd5;
      }
    }
  }
  .home_right_panel {
    // height: calc(100% - 56px);
    flex: 1;
    background: #abd5;
    padding: 10px;
    overflow: auto;
  }
}
</style>
