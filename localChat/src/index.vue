
<template>
  <router-view  v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>
<script lang="ts" setup>
// import { socket } from '@js/apiCall.js';
// import { onMounted } from 'vue';
// onMounted(() => {
//   console.log(import.meta.glob)
//   window.socket = socket;

// })
console.log(1111);
</script>
<style scoped lang="scss"></style>
