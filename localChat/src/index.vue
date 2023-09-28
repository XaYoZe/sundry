
<template>
  <router-view></router-view>
</template>
<script setup>
import { socket } from '@js/apiCall.js';
window.socket = socket;
</script>
<style scoped lang="scss">
</style>
