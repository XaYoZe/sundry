
<template>
  <router-view  v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  <PopupCtrl></PopupCtrl>
</template>
<script lang="ts" setup>
import PopupCtrl from '@cpt/common/PopupCtrl.vue';
</script>
<style scoped lang="scss"></style>
