<template>
  <div class="setting table-responsive ">
    <div class="d-grid p-0 mb-1">
      <button
        class="btn btn-primary rounded-0 mb-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#apiConfig"
        aria-expanded="false"
        aria-controls="apiConfig"
      >
        接口配置
      </button>
      <div class="collapse show px-2" id="apiConfig">
        <div class="mb-1">
          <label for="betaApiConfig" class="form-label">beta</label>
          <textarea class="form-control" id="betaApiConfig" rows="2" v-model="beta"></textarea>
        </div>
        <div class="mb-3">
          <label for="stagingApiConfig" class="form-label">staging</label>
          <textarea class="form-control" id="stagingApiConfig" rows="2" v-model="staging"></textarea>
        </div>
        <div class="d-grid text-center mb-3">
          <button
            class="btn btn-outline-success btn-sm"
            type="button" @click="saveApi">確認</button>
        </div>
      </div>
    </div>
    <div class="d-grid p-0 mb-1">
      <button
        class="btn btn-primary rounded-0 mb-1"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#whiteList"
        aria-expanded="false"
        aria-controls="whiteList"
      >
        右鍵白名單
      </button>
      <div class="collapse px-2" id="whiteList">
        <ul class="list-group p-1">
          <li
            class="list-group-item"
            v-for="(item, i) in whiteList"
            :key="i"
          >
            {{ item }}
            <i class="position-absolute top-50 end-0 translate-middle text-danger bi bi-x-circle" @click="changeWhiteList(i)"
              ></i>
          </li>
          <li class="list-group-item p-0">
            <div class="input-group">
              <input type="text" class=" border-0 form-control form-control-plaintext text-center list-group-item list-group-item-action" placeholder="Recipient's username" aria-label="Recipient's username" aria-describedby="button-addon2" v-model="whiteListName">
               <span class="input-group-text rounded-0 border-0" @click="changeWhiteList()">
                <i class="text-success bi bi-plus-circle">
            </i>
               </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";

let whiteList = ref([]);
let whiteListName = ref('https://localhost');
chrome?.runtime?.sendMessage({type: 'get', data: 'whiteList'}, (res) => {
  console.log("接受消息", res);
  whiteList.value = res || [];
})
// 修改白名單
const changeWhiteList = (index) => {
  let list = [...whiteList.value]
  console.log(index, typeof index === 'number');
  if (typeof index === 'number') {
    list.splice(index, 1)
  } else {
    if (list.includes(whiteListName.value)) return
    list.push(whiteListName.value)
  }
  chrome?.runtime?.sendMessage({type: 'set', data: {whiteList: list}}, (res) => {
    whiteList.value = list;
  })
}


let beta = ref('https://beta.miyachat.com/');
let staging = ref('https://staging-api.miyachat.com/');
chrome?.runtime?.sendMessage({type: 'get', data: 'server'}, (res) => {
  if (res) {
    beta.value = res.beta;
    staging.value = res.staging;
  }
})
const saveApi = () => {
  chrome?.runtime?.sendMessage({type: 'set', data: {'server': {beta: beta.value, staging: beta.value}}}, (res) => {
    console.log(res);
  })
}
</script>
<style lang="scss">
.setting {
  height: 100%;
  overflow: auto;
  overflow-x: hidden;
  > div {
    width: 100vw;
  }
}
</style>
