<!-- 弹窗控制 -->
<template>
  <div class="popup_ctrl">
    <transition-group :duration="{ enter: 300, leave: 300 }">
      <div
        class="popup_ctrl_mask"
        @click.stop.self="clickMask(item)"
        v-for="item in popupList"
        :key="item.name"
        :style="{ '--opacity': item.option.opacity, zIndex: item.option.zIndex || 99999 + item.id }"
        :class="[item.option.anime]"
      >
        <div class="popup_ctrl_content" v-if="item.name">
          <keep-alive>
            <Component v-on="item.event" v-bind="item.data" :is="item.name" :popupId="item.id" @close="onClose(item)" ></Component>
          </keep-alive>
        </div>
      </div>
      <div class="popup_ctrl_toast" v-for="item in toastList" :key="item.id" :class="item.type"
        :style="{zIndex: 99999 + item.id }"
      >{{ item.text }}</div>
    </transition-group>
  </div>
</template>
<script setup>
import { computed, ref, reactive, watch, watchEffect, inject, shallowRef } from 'vue'

let isSSR = inject('isSSR');
let popupStore = inject('popupStore')
let popupList = computed(() => popupStore.popupList || []);
let toastList = computed(() => popupStore.toastList || []);

let transition = ['PopupBlackList', 'PopupActEnd']
let showTransition = (name) => !transition.includes(name)

watch(
  popupList,
  (val) => {
    if (isSSR) return;
    if (val?.length) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
  { immediate: true, deep: true }
)

// 點擊關閉
const onClose = (item) => {
  // 有自定義關閉事件
  if (item.event.close) {
    return
  }
  popupStore.close(item.id)
};

// 點擊遮罩
const clickMask = (item) => {
  if (item.option.maskClose) {
    // 有自定義關閉事件
    if (item.event.close) {
      item.event.close?.();
      return
    }
    popupStore.close(item.id)
  }
};

</script>
<style lang="scss">

.popup_ctrl {
  z-index: 9999;
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
    width: 100%;
    height: 100%;
    background: rgba($color: #17191E, $alpha: var(--opacity, 0.88));
    transition: background 0.3s;
    display: flex;
    .popup_ctrl_content {
      transition: transform 0.3s;
    }
    .v-enter-from, 
    .v-leave-to {
      background: #00000000;
    }
    // 中间放大
    &.center {
      align-items: center;
      justify-content: center;
      &.v-enter-from,
      &.v-leave-to {
        .popup_ctrl_content {
          transform: scale(0.2);
        }
      }
    }
    // 底部弹出
    &.bottom {
      align-items: flex-end;
      // transform: translateY(0%);
      &.v-enter-from,
      &.v-leave-to {
        .popup_ctrl_content {
          transform: translateY(100%);
        }
      }
    }
    // 彈跳進入
    &.bounce {
      align-items: center;
      justify-content: center;
      .popup_ctrl_content {
        @keyframes bounceAnime {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          14% {
            transform: scale(1.1);
            opacity: 1;
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.02);
          }
          60% {
            transform: scale(1);
          }
        }
        animation: bounceAnime 1s linear;
      }
      // &.v-enter-from,
      &.v-leave-to {
        .popup_ctrl_content {
          transform: scale(0.2);
        }
      }
    }
  }
  
  .popup_ctrl_toast {
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
  // .popup_ctrl_toast {
  //   pointer-events: auto;
  //   user-select: none;
  //   position: fixed;
  //   top: 50%;
  //   left: 50%;
  //   transform: translate(-50%, -50%);
  //   width: max-content;
  //   max-width: 70%;
  //   min-width: 250px;
  //   background: rgba($color: #000, $alpha: var(--opacity, 0.80));
  //   font-size: 28px;
  //   font-weight: 400;
  //   line-height: 32px;
  //   color: #ffff;
  //   padding: 14px 40px;
  //   border-radius: 10px;
  //   word-break: break-word;
  //   text-align: center;
  //   opacity: 1;
  //   transition: 0.3s opacity;
  //   &.v-enter-from, 
  //   &.v-leave-to {
  //     opacity: 0;
  //   }
  // }
}
</style>
