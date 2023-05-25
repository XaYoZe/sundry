<template>
  <div class="history table-responsive ">
    <table class="table mb-0 table-sm">
      <thead>
        <tr>
          <th class="table-info">時間</th>
          <th class="table-info">環境</th>
          <th class="table-info">id</th>
          <!-- <th class="table-info">key</th> -->
          <th class="table-info">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in historyList" :key="item.create">
          <td class="table-primary">{{ dateFromat(item.create, 'Y-M-D') }}<br />{{ dateFromat(item.create, 'H:m:s') }}</td>
          <td class="table-primary">{{ item.env }}</td>
          <td class="table-primary">{{ item.uid }}</td>
          <!-- <td class="table-primary">{{ item.key }}</td> -->
          <td class="table-primary">
            <div class=" d-grid gap-2 d-md-block">
              <button type="button" class="btn btn-primary btn-sm">複製key</button>
              <button type="button" class="btn btn-info btn-sm text-white">使用key</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { dateFromat } from '@js/common.js'

let historyList = ref([
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
  {create: Date.now(), env: 'beta', uid: 123456},
]);
chrome?.runtime?.sendMessage({type: 'history'}, (res) => {
  console.log(res)
  historyList.value = res
})

// async function getHistory() {
//   try {
//     let { history } = await chrome.storage.local.get("history");
//     if (history.length) {
//       historyList.value = history;
//     }
//   } catch (err) {
//     console.log(err);
//   }
// }
</script>

<style lang="scss" scoped>
.history {
  text-align: center;
  font-size: 16px;
  height: 100%;
  table {
    tbody {
      height: calc(100% - 100px);
      overflow: auto;
    }
    td {
      vertical-align: middle;
    }
  }
}
</style>