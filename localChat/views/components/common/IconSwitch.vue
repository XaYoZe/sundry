<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" version="1.1">
    <path  fill="transparent" :class="{open}"></path>
  </svg>
</template>
<script lang="ts" setup>
const { open } = defineProps({
  open: {}
})
</script>
<style lang="scss" scoped>
svg {
  path {
    d: path("M1,6 L 12,18 L24,6");
    stroke: currentColor;
    fill: transparent;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: all 0.3s linear 0.1s;
    &.open {
      d: path("M1,12 L 12,12 L24,12");
    }
  }
}
</style>