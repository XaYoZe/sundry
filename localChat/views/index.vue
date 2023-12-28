
<template>
  <router-view  v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  <Teleport to="body">
    <PopupCtrl></PopupCtrl>
  </Teleport>
</template>
<script lang="ts" setup></script>
<style scoped lang="scss"></style>
