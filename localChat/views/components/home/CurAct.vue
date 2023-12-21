<template>
  <div class="CurAct h-100">
    <div class="row mx-0 h-100">
    <div class="col-sm-3">
      <ul>
        <li v-for="i in 10" :key="i">{{ i }}</li>
      </ul>
    </div>
    <div class="col-sm-9">
      <div class="w-100 h-50"></div>
      <textarea name="" id="" cols="30" rows="10"  class="w-100 m-0 py-0"></textarea>
    </div>
    </div>
  </div>
</template>
<script setup>
import { onBeforeMount, ref } from "vue";
import { dateFromat, getUrlParam, setUrlParam } from "@js/common.js";
import apiCall, { socket } from '@js/apiCall.js';

onBeforeMount(() => {
  apiCall.getData({"id": 100143}).then(res => {
    console.log(res);
  })
})

</script>
<style lang="scss">
.CurAct {
  width: 100%;
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
