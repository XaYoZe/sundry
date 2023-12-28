// 弹窗控制
<template>
  <!-- <div class="popup_ctrl">
    <keep-alive :exclude="[]">
      <transition-group :duration="{ enter: 300, leave: 300 }">
        <div
          class="popup_ctrl_mask"
          @click.self="clickMask(item.id)"
          v-for="item in popupList"
          :key="item.name"
          :style="{ '--opacity': item.opacity || 0.88, zIndex: item.zIndex }"
          :class="{ anime: showTransition(item.name) }"
        >
          <div class="popup_ctrl_content" v-if="item.name">
            <Component :is="item.name" :popupId="item.id" :popupData="item.data" :popupEvent="item.event" @close="onClose(item.id)"></Component>
          </div>
        </div>
      </transition-group>
    </keep-alive>
  </div>
  <div class="tip_ctrl">
    <transition-group :duration="{ enter: 300, leave: 300 }">
      <div class="tip_info" v-for="tip in tipList" :key="tip.id" :class="[tip.type]" v-show="tip.show">{{ tip.text }}</div>
    </transition-group>
  </div> -->
</template>
<script lang="ts" setup>

// import usePopupStore from '@pinia/popup'
// import dataStore from '@pinia/data'
// import { computed, ref, reactive, watch, inject } from 'vue'

// let isSSR = inject('isSSR')
// let popupStore = usePopupStore()
// let popupList = computed(() => popupStore.popupList)
// let tipList = computed(() => popupStore.tipList)

// let transition = []
// let showTransition = (name) => !transition.includes(name)

// watch(
//   popupList,
//   (val) => {
//     if (!isSSR) {
//       if (val.length) {
//         document.body.style.overflow = 'hidden'
//       } else {
//         document.body.style.overflow = ''
//       }
//     }
//   },
//   { immediate: true, deep: true }
// )

// 點擊關閉
// const onClose = (id) => {
//   popupStore.close(id)
// };

// const clickMask = (id) => {
//   onClose(id)
// }
</script>
<style lang="scss">
@import '@style/common.scss';
.popup_ctrl, .tip_ctrl {
  z-index: 99;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  .popup_ctrl_mask {
    z-index: 1;
    position: absolute;
    pointer-events: auto;
    top: 0;
    left: 0;
    --opacity: 0.9;
    width: 100%;
    height: 100%;
    background: rgba($color: #17191E, $alpha: var(--opacity));
    transition: background 0.3s;
    @include flexCenter;
    .popup_ctrl_content {
      @include flexCenter;
      transition: transform 0.3s;
      // height: 100%;
      // width: 100%;
      > div:first-child {
        margin-top: -80px;
      }
    }
    &.anime.v-enter-from,
    &.anime.v-leave-to {
      background: #00000080;
      .popup_ctrl_content {
        transform: scale(0.2);
      }
    }
  }

  .tip_info {
    pointer-events: auto;
    position: absolute;
    left: 50%;
    top: 10%;
    transform: translate(-50%, 0);
    min-height: 40px;
    min-width: 100px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    padding: 0 20px;
    background: #fff;
    color: #666;
    transition: transform 0.3s, opacity 0.2s;
    font-weight: 600;
    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
      transform: translate(-50%, -100%);
    }
    &.success {
      background: rgb(92, 240, 92);
      color: #fff;
    }
    &.waring {
      background: rgb(245, 200, 116);
      color: #fff;
    }
    &.error {
      background: rgb(243, 89, 89);
      color: #fff;
    }
  }
}
</style>
