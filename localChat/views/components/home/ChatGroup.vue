<!-- 聊天分组 -->
<template>
  <div class="chat_group">
    <div class="group_item" ref="groupItem"  v-for="(groupData, i) in group" :key="groupData.name" @drop.stop="onDrop($event, i)" @dragover.prevent>
      <div class="group_table" @click="swithListShow(groupData)">
        <div class="group_icon"><ChatBubbleLeftRightIcon /></div>
        {{ groupData.name }}
        <div class="switch_icon" :class="{ open: groupData.open }">
          <IconSwitch :open="groupData.open"></IconSwitch>
        </div>
      </div>
      <div class="group_list" :class="{ open: groupData.open }">
        <div class="group_hide">
          <div class="chat_item" draggable="true" @dragstart="onDragstart($event, `${i}_${x}`)" v-for="(item, x) in groupData.list" :class="{active:  `${i}_${x}` === activeIndex}" :key="i">
            <div class="chat_icon"></div>
            <div class="chat_table">
              {{ item.name }}{{  `${i}_${x}` }}
            </div>
            <div class="chat_tip">
              <div class="last_time">{{ item.lastTime }}</div>
              <div class="new_msg">{{ item.newMsg }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, nextTick, onMounted, onServerPrefetch, reactive, ref, Ref } from "vue";
import { ChatBubbleLeftRightIcon } from "@heroicons/vue/24/outline";
import IconSwitch from "../common/IconSwitch.vue";

let group = ref([
  { name: "全部", list: Array.from(Array(10), (_, i) => ({ name: `好友`, lastTime: '12-15', newMsg: '1'})), open: false },
  { name: "群聯", list: Array.from(Array(10), (_, i) => ({ name: `好友`, lastTime: '12-15', newMsg: '1'})) , open: false },
  { name: "好友1", list: Array.from(Array(10), (_, i) => ({ name: `好友`, lastTime: '12-15', newMsg: '1'})), open: false },
  { name: "好友2", list: Array.from(Array(10), (_, i) => ({ name: `好友`, lastTime: '12-15', newMsg: '1'})), open: false },
  { name: "好友3", list: Array.from(Array(10), (_, i) => ({ name: `好友`, lastTime: '12-15', newMsg: '1'})), open: false },
]);

onMounted(()=> {
  // group.value = [];
})

const swithListShow = (item) => {
  item.open = !item.open;
};

const groupItem = ref<HTMLDivElement[]>(null)
let dropEl:HTMLDivElement = null;

/**
 * 
 * @param event {DragEvent}
 */
const onDrop = (event:DragEvent, i: number) => {
  if (dropEl) {
    groupItem.value[i].querySelector('.group_list .group_hide').appendChild(dropEl);
    dropEl = null;
    activeIndex.value = '';
  } else {
    console.log(event.dataTransfer, i);
    Array.from(event.dataTransfer.items, type => {
      console.log(type)
      // 实验功能
      // if (type.getAsFileSystemHandle) {
      //   type.getAsFileSystemHandle().then(res => {
      //     console.log('getAsFileSystemHandle', res);
      //   })
      // } else
      if (type.kind == 'file') {
        console.log('getAsFile', type.getAsFile());
      } else if (type.kind === 'string') {
        type.getAsString((res) => {
          console.log('getAsString', res)
        })
      }
    })
  }
  event.preventDefault();
}

const activeIndex = ref('');
const onDragstart = (event, i) => {
  dropEl = event.target
  activeIndex.value = i;
}

</script>
<style lang="scss">
.chat_group {
  position: relative;
  z-index: 1;
  // height: 100%;
  width: 300px;
  margin-right: -3px;
  overflow: auto;
  
.group_item {
  border-bottom: 1px solid #6666;
  .group_table {
    display: flex;
    align-items: center;
    justify-content: start;
    padding: 0 20px;
    height: 32px;
    font-size: 18px;
    background: snow;
    position: sticky;
    z-index: 2;
    top: 0;
    &.open {
    }
    svg {
      height: 20px;
    }
    .group_icon {
      margin-right: 5px;
    }
    .switch_icon {
      position: absolute;
      left: 260px;
      // margin-left: auto;
    }
  }
  .group_list {
    // transform-origin: top center;
    background: #a0a0a022;
    width: 100%;
    transition: grid 0.3s ease;
    display: grid;
    grid-template-rows: 0fr;
    &.open {
      grid-template-rows: 1fr;
    }
    .group_hide {
      overflow: hidden;
    }
    .chat_item {
      width: 100%;
      height: 50px;
      padding: 5px 20px;
      display: flex;
      align-items: center;
      position: relative; 
      &:not(:last-child) {
        border-bottom: 1px solid #d6d6d6;
      }
      &:hover {
        background: #0002;
      }
      &.active {
        opacity: 0.5;
      }
      .chat_icon {
        height: 40px;
        width: 40px;
        background: #f6f6f6;
      }
      .chat_table {
        margin-left: 15px;
        font-size: 16px;
      }
      .chat_tip {
        display: flex;
        flex-direction: column;
        position: absolute;
        left: 280px;
        transform: translate(-100%);
        text-align: right;
        width: max-content;
        font-size: 14px;
        justify-content: center;
        .last_time {
          margin-left: auto;
          color: #6668;
          margin-bottom: 4px;
        }
        .new_msg {
          margin-left: auto;
          height: 14px;
          width: max-content;
          font-size: 12px;
          font-weight: 600;
          background:  red;
          position: relative;
          color: #fff;
          border-radius: 7px;
          padding: 0 5px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }
}
}
</style>