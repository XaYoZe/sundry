<!-- 搜索 -->
<template>
  <div class="search">
    <div class="search_mask" @click.self="open = false" v-if="open"></div>
    <div class="search_input"><input type="text" placeholder="查找" v-model="search"><div class="search_icon"><MagnifyingGlassIcon /></div></div>
    <Transition :duration="100">
      <div class="search_result" v-if="open">
        <div class="search_result_group" v-for="result in searchResult" :key="result.type">
          <div class="search_result_table">{{ result.table }}</div>
          <div class="search_result_list">
            <div class="search_result_list_item" v-for="item in result.list" :key="item.id">
              <div v-if="result.type === 1" class="search_item_user">
                <div class="search_user_icon"></div>
                <div class="search_user_name">{{ item.name }}</div>
              </div>
              <div v-if="result.type === 2" class="search_item_group">
                <div class="search_user_icon"></div>
                <div class="search_user_name">{{ item.name }}</div>
              </div>
              <div v-if="result.type === 3" class="search_item_history" >
                <div class="history_user_info">
                  <div class="history_user_icon"></div>
                  <div class="history_user_name">{{ item.name }}</div>
                </div>
                <div class="history_number">相关记录 <span>{{ item.history.length }}</span> 条</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script lang="ts" setup>
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { ref, watch } from 'vue';

// 搜索内容
const search = ref('');
// 搜索结果
const searchResult:Array<{
  type: number,
  table:string,
  list: Array<{id: number, name: string, history?: Array<any>}>
  }> = [{
  type: 1,
  table: '联系人',
  list: Array.from(Array(10), (item, i) => ({id: i, name: `名字${i}`}))
}, {
  type: 2,
  table: '群组',
  list: Array.from(Array(10), (item, i) => ({id: i, name: `群组${i}`}))
}, {
  type: 3,
  table: '聊天记录',
  list: Array.from(Array(10), (item, i) => ({id: i, name: `名字${i}`, history: [`聊天记录${i}`]}))
}];
const open = ref(false);
watch(search, (val) => {
  open.value = !!val;  
}, {immediate: true})
</script>
<style lang="scss">
.search {
  flex-shrink: 0;
  width: 100%;
  padding: 5px 15px 5px 20px;
  height: 40px;
  position: relative;
  border-bottom: 1px solid #ccc;
  z-index: 2;
  .search_input {
    display: flex;
    position: relative;
    align-items: center;
    z-index: 3;
    input {
      flex: 1;
      height: 30px;
      font-size: 16px;
    }
    .search_icon {
      flex-shrink: 0;
      width: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
      svg {
        width: 30px;
      }
    }
  }
  .search_mask {
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
  }
  .search_result {
    height: 500px;
    position: absolute;
    z-index: 1;
    width: calc(100% - 10px);
    height: 500px;
    background: #eee;
    border-radius: 5px;
    top: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    overflow: auto;
    transition: all 0.2s ease;
    opacity: 1;
    border: 1px solid #bacc;
    &.v-enter-active,
    &.v-leave-active {
      border-top: 0px solid #bacc;
      border-bottom: 0px solid #bacc;
      height: 0;
      opacity: 0.8;
    }
    .search_result_group {
      &:not(:last-child) {
        // border-bottom: 1px solid #6666;
      }
      // padding: 0 15px;
      .search_result_table {
        padding: 0 20px;
        height: 30px;
        line-height: 30px;
        color: #888;
        // position: sticky;
        // top: 0;
        background: #fafafa;
      }
      .search_result_list {
        background: #fafafa;
        padding-bottom: 5px;
        // padding: 0 20px 10px;
        .search_result_list_item {
          &:not(:last-child) {
            margin-bottom: 5px;
          }
          padding: 0 10px;
          > div {
            border-radius: 5px;
            background: #8881;
            &:hover {
              background: #8882;
            }
          }
          .search_item_user, .search_item_group {
            padding: 10px;
            width: 100%;
            display: flex;
            align-items: center;
            .search_user_icon {
              width: 30px;
              height: 30px;
              background: #abd;
              margin-right: 10px;
            }
          }
          .search_item_history {
            padding: 10px;
            .history_user_info {
              display: flex;
              margin-bottom: 5px;
              .history_user_icon {
                width: 20px;
                height: 20px;
                background: #abd;
                margin-right: 10px;
              }
              .history_user_name {
                line-height: 20px;
                font-size: 16px;
              }
            }
            .history_number {
              font-size: 14px;
              color: #0006;
              font-weight: 600;
              span {
                color: rgb(0, 0, 133);
              }
            }
          }
        }
      }
    }
  }
}
</style>