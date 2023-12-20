<template>
  <div class="history table-responsive ">
    <table class="table mb-0 table-sm">
      <thead>
        <tr>
          <th class="table-info">時間</th>
          <th class="table-info">環境</th>
          <th class="table-info">id</th>
          <th class="table-info">操作</th>
        </tr>
      </thead>
    </table>
    <div class="scroll-table">
      <table class="table mb-0 table-sm">
      <!-- <thead>
        <tr>
          <th class="table-info">時間</th>
          <th class="table-info">環境</th>
          <th class="table-info">id</th>
          <th class="table-info">操作</th>
        </tr>
      </thead> -->
      <tbody>
        <tr v-for="item in historyList" :key="item.create">
          <td class="">{{ dateFromat(item.create, 'Y-M-D') }}<br />{{ dateFromat(item.create, 'H:m:s') }}</td>
          <td class="">{{ item.env }}</td>
          <td class="">{{ item.uid }}</td>
          <!-- <td class="">{{ item.key }}</td> -->
          <td class="">
            <div class=" d-grid gap-2 d-md-block">
              <button type="button" class="btn btn-primary btn-sm" @click="clickCopy(item)">複製key</button>
              <button type="button" class="btn btn-info btn-sm text-white" @click="clickUse(item)">使用key</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { dateFromat, setUrlParam } from '@js/common.js'

let historyList = ref([]);

const clickUse = async (item) => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  jumpUrl(tab, {key: item.key})
}

const clickCopy = async (item) => {
  console.log(item);
}
// 跳轉鏈接
const jumpUrl = async (tab, params = {}) => {
  let url = tab.url
  for (let key in params) {
    url = setUrlParam(url, key, params[key])
  }
  await chrome.tabs.update(tab.id, {
    url,
    active: true,
  });
}
</script>

<style lang="scss" scoped>
.history {
  text-align: center;
  font-size: 16px;
  height: 100%;
  .scroll-table {
    height: calc(100% - 37px);
    overflow: auto;
  }
  table {
    thead {
      height: 35px;
      th {
        line-height: 35px;
        padding: 0;
      }
    }
    tbody {
    }
    td {
      vertical-align: middle;
    }
  }
}
</style>