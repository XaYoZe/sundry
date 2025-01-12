<!-- 弹窗控制 -->
<template>
  <div class="popup_ctrl">
    <Transition
      v-bind="popupItem.transitionConfig"
      v-for="popupItem in popupList"
      :key="popupItem.name"
    >
      <div
        class="popup_ctrl_mask"
        @click.stop.self="popupItem.option.maskClose && popupItem.close()"
        :key="popupItem.name"
        :style="[{ '--opacity': popupItem.option.opacity, zIndex: popupItem.option.zIndex || 99999 + popupItem.id }, popupItem.option.maskStyle]"
        :class="[popupItem.option.anime]"
        v-if="popupItem.show"
      >
        <div class="popup_ctrl_content" v-if="popupItem.name">
          <Component v-on="popupItem.event" v-bind="popupItem.data" :is="popupItem.name" :popupId="popupItem.id" :ref="popupItem.onRef"></Component>
        </div>
      </div>
    </Transition>
    <transition-group :duration="300">
      <div class="popup_ctrl_toast" name="toast" v-for="item in toastList" :key="item.id" :class="item.option.type"  :style="{ zIndex: 99999 + item.id }">{{ item.text }}</div>
    </transition-group>
  </div>
</template>
<script setup>
import { computed, watch, inject, ref, nextTick } from 'vue'

const popupStore = inject('popupStore')
// 弹窗列表
const popupList = computed(() => popupStore.popupList)
// toast列表
const toastList = computed(() => popupStore.toastList)

watch(
  popupList,
  (val) => {
    if (!import.meta.env.SSR) {
      if (val.length) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  { immediate: true, deep: true }
);

</script>
<style lang="scss">
.popup_ctrl {
  z-index: 9999;
  width: 100vw;
  height: 100vh;
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
    background: rgba($color: #000000, $alpha: var(--opacity, 0.8));
    display: flex;
    &.none {
      align-items: center;
      justify-content: center;
    }
    // 中间放大
    &.center {
      align-items: center;
      justify-content: center;
      .popup_ctrl_content {
        transition: transform 0.3s;
      }
      &-enter-from,
      &-leave-to {
        transition: background 0.3s;
        background: #00000000;
        .popup_ctrl_content {
          transform: scale(0.2);
        }
      }
    }
    // 底部弹出
    &.bottom {
      align-items: flex-end;
      transform: translateY(0);
      .popup_ctrl_content {
        transition: transform 0.3s;
      }
      &-enter-from,
      &-leave-to {
        transition: background 0.3s;
        background: #00000000;
        .popup_ctrl_content {
          transform: translateY(100%);
        }
      }
    }
    // 彈跳進入
    &.bounce {
      align-items: center;
      justify-content: center;
      // 進入動畫
      @keyframes bounceEnter {
        0% {
          transform: scale(0.8);
          filter: opacity(0);
        }
        14% {
          transform: scale(1.1);
          filter: opacity(1);
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
      // 離開動畫
      @keyframes bounceLeaver {
        from {
          transform: scale(1);
          filter: opacity(1);
        }
        to {
          transform: scale(0.2);
          filter: opacity(0);
        }
      }
      .popup_ctrl_content {
        opacity: 1;
        animation: bounceEnter 1s linear;
        transition: all 0.3s;
      }

      &-enter-from,
      &-leave-to {
        transition: background 0.3s;
        background: #00000000;
      }
      &-leave-to {
        .popup_ctrl_content {
          animation: bounceLeaver 0.3s linear;
          opacity: 0;
        }
      }
    }
  }

  // toast樣式
  
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
    &.toast-enter-from,
    &.toast-leave-to {
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
