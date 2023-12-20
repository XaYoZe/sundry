<template>
  <div class="login_page">
    登錄頁{{ dataStore.a }}
    <button @click="$router.push('home')">登陆</button>
    <button @click="dataStore.a++">登陆</button>
  </div>
</template>
<script lang="ts" setup>
import useDataStore from '../pinia/data'

let dataStore = useDataStore();

setTimeout(() => {
  dataStore.a = 5
  console.log(dataStore.a);
}, 2000)
console.log('当前页面登陆页')
</script>
