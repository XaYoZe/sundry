<template>
  <div class="CurAct">
    <div class="last_data">
      <h4 class="ps-3 py-2 m-0">鏈接</h4>
      <ul class="list-group list-group-flush border-top border-bottom">
        <li class="list-group-item d-flex pe-0">
          <label
            for="urlOrigin"
            class="d-flex m-0 col-2 text-warp form-label align-items-center lh-1"
            style="word-wrap: anywhere"
            >域名</label
          >
          <div class="col-10 p-0 pe-3 align-items-center input-group-sm">
            <input class="form-control" id="urlOrigin" v-model="origin" />
          </div>
        </li>
        <li class="list-group-item d-flex pe-0">
          <label
            for="urlPathname"
            class="d-flex m-0 col-2 text-warp form-label align-items-center lh-1"
            style="word-wrap: anywhere"
            >路徑</label
          >
          <div class="col-10 p-0 pe-3 align-items-center input-group-sm">
            <input class="form-control" id="urlPathname" v-model="pathname" />
          </div>
        </li>
        <li class="list-group-item d-flex pe-0 py-0">
          <label
            class="d-flex m-0 col-2 text-warp form-label align-items-center lh-1"
            style="word-wrap: anywhere"
            >參數</label
          >
          <div class="col-10 p-0 align-items-center input-group-sm border-start">
            <div class="p-0 pe-3 position-relative" style="max-height: 200px; overflow: auto">
              <div
                class="params-item row col-12 m-0 ps-2 py-1"
                v-for="(item, i) in urlParams"
                :key="item.key"
                :class="{' border-top': i > 0}"
              >
                <label
                  :for="item.key"
                  class="d-flex m-0 col-3 text-warp ps-0 form-label align-items-center lh-1"
                  style="word-wrap: anywhere"
                  >{{ item.key }}</label
                >
                <div class="col-9 p-0 align-items-center input-group-sm">
                  <input
                    class="form-control"
                    :id="item.key"
                    v-model="item.value"
                  />
                </div>
                <i class="bi bi-dash-square" @click="urlParams.splice(i, 1)"></i>
              </div>
              <div
                class="row col-12 m-0 ps-2 py-1 border-top position-relative">
                <div
                  class="d-flex m-0 col-3 text-warp ps-0 form-label align-items-center lh-1  input-group-sm"
                  >
                  <input
                    class="form-control"
                    v-model="newParams.key"
                  /></div
                >
                <div class="col-9 p-0 align-items-center input-group-sm">
                  <input
                    class="form-control"
                    v-model="newParams.value"
                  />
                </div>
                <i class="bi bi-plus-square" @click="newParams.key && newParams.value && urlParams.push({key: newParams.key, value: newParams.value})"></i>
              </div>
            </div>
          </div>
        </li>
        <li class="list-group-item d-flex pe-0">
          <label
            for="urlHash"
            class="d-flex m-0 col-2 text-warp form-label align-items-center lh-1"
            style="word-wrap: anywhere"
            >哈希</label
          >
          <div class="col-10 p-0 pe-3 align-items-center input-group-sm">
            <input class="form-control" id="urlHash" v-model="hash" />
          </div>
        </li>
      </ul>
      <div class="row mx-0 justify-content-center p-2">
        <button
          type="button"
          class="btn col-6 btn-outline-primary btn-sm"
          @click="changeUrl"
        >
          修改參數並跳轉
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onBeforeMount, ref } from "vue";
import { dateFromat, getUrlParam, setUrlParam } from "@js/common.js";

let curPageTab = null;
let urlParams = ref({});
let curPageUrl = "";
let curKeyData = ref({});
let origin = ref("");
let pathname = ref("");
let hash = ref("");
let newParams = ref({key: '', value: ''})

onBeforeMount(async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url = new URL(tab.url);
  curPageTab = tab;
  curPageUrl = tab.url;
  urlParams.value = getUrlParam(tab.url);
  origin.value = url.origin;
  pathname.value = url.pathname;
  hash.value = url.hash;
  console.log(urlParams.value);
});

const changeUrl = () => {
  let url = `${origin.value}${pathname.value}${hash.value.replace(/^#?(.*)/, (s, e) => `${e.length > 0 ? '#' : '' }${e}`)}`;
  urlParams.value.forEach((item) => {
    url = setUrlParam(url, item.key, item.value);
  });
  chrome.tabs.update(curPageTab.id, { url, active: true });
};
</script>
<style lang="scss">
.CurAct {
  .list-group-item {
    i {
      position: absolute;
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: red;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      &.bi-plus-square {
        color: green;
      }
    }
    .params-item {
      position: relative; 
      i {
        display: none;
      }
      &:hover {
        i {
          display: flex;
        }
      }
    }
  }
}
</style>
