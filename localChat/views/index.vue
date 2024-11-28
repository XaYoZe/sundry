
<template>
  <router-view  v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  <Teleport to="body">
    <PopupCtrl></PopupCtrl>
  </Teleport>
</template>
<script lang="ts" setup>
import PopupCtrl from '@cpt/PopupCtrl/PopupCtrl.vue';
</script>
<style scoped lang="scss"></style>
