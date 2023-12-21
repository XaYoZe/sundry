
<template>
  <router-view  v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  <PopupCtrl></PopupCtrl>
</template>
<script lang="ts" setup>
// import { socket } from '@js/apiCall.js';
// import { onMounted } from 'vue';
// onMounted(() => {
//   console.log(import.meta.glob)
//   window.socket = socket;

// })
</script>
<style scoped lang="scss"></style>
