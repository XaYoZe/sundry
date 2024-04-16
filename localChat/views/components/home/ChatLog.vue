<template>
  <div class="chat_log" ref="chatLogEl">
    <div class="chat_item" v-for="(item, i) in chatLog" :key="i">
          <div class="chat_icon"></div>
          <div class="chat_table">
            {{ item.name }}
          </div>
          <div class="chat_tip">
            <div class="last_time">{{ item.lastTime }}</div>
            <div class="new_msg">{{ item.newMsg }}</div>
          </div>
    </div>
  </div>
</template>
<script setup>
import { watch } from 'vue';
import { ref, inject,  onMounted, computed } from 'vue';

// const chatLog = ref(Array.from(Array(30), (item, index) => ({
//   name: `好友${index}`,
//   lastTime: '12-15',
//   newMsg: '1'
// })))

const dataStore = inject('dataStore');

let chatLog = computed(() => dataStore.chatLog);

watch(chatLog, () => {
  console.log(chatLog.value)
}, {deep: true, immediate: true})

// const chatLogEl = ref(null);
onMounted(() => {
  // chatLogEl.scrollTop = 200;
})

</script>
<style lang="scss">
.chat_log {
  width: 100%;
  height: 50%;
  background: #ba38;
  border-radius: 5px;
  margin-bottom: 10px;
  overflow: auto;
}
</style>