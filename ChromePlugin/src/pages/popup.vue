<template>
  <div class="popup">
    <div class="popup_content">
      <h1>key生成參數</h1>
      <p><label for="id">用戶id: </label><input type="text" v-model="id" /></p>
      <p><label for="name">用戶名: </label><input type="text" v-model="name" /></p>
      <button @click="clickConfirm">確定</button>
      <div class="error_tip" v-if="errorTip">生成失敗, 檢查id是否正確或者接口是否正常 </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { random, setUrlParam } from "../js/common";

const $route = useRoute();
const { env, type, tabId } = $route.query;

let id = ref("");
let name = ref("");
let errorTip = ref(false);
async function clickConfirm() {
  chrome.runtime.sendMessage(undefined, {
    type: 'getKey',
    data: {
      id: id.value,
      name: name.value,
      env,
      tabId
    }
  }, undefined,async (err) => {
    console.log('接受回調', err)
    if (err) {
      errorTip.value = true;
      console.log("獲取key失敗", err);
      return
    }
    await chrome.tabs.remove((await chrome.tabs.getCurrent()).id);
  })
}
</script>

<style lang="scss">
.popup {
  width: 350px;
  margin: 0 auto;
  text-align: center;
  .popup_content {
    padding-top: 16px;
    h1 {
      margin-top: 0;
    }
    p {
      position: relative;
      width: max-content;
      margin: 16px auto;
      label {
        display: inline-block;
        vertical-align: middle;
        width: 80px;
        text-align: right;
        margin-right: 20px;
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
      }
      input {
        height: 20px;
        width: 200px;
      }
    }
    button {
      width: 100px;
    }
  }
  .error_tip {
    margin-top: 10px;
    color: red;
  }
}
</style>
