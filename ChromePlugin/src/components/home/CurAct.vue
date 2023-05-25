<template>
  <div class="CurAct">
      <div class="last_data">
        <h1>鏈接參數</h1>
        <div class="row">
          <div class="key">生成時間:</div>
          <div class="value">
            {{ new Date(curKeyData.create).toLocaleString() }}
          </div>
        </div>
        <div class="row">
          <div class="key">環境:</div>
          <div class="value">{{ curKeyData.env }}</div>
        </div>
        <div class="row">
          <div class="key">用戶id:</div>
          <div class="value">{{ curKeyData.uid }}</div>
        </div>
        <div class="row">
          <div class="key">用戶名:</div>
          <div class="value">{{ curKeyData.name }}</div>
        </div>
        <div class="row">
          <div class="key">key:</div>
          <div class="value">{{ curKeyData.key }}</div>
        </div>
      </div>
  </div>
</template>
<script setup>
import { ref } from "vue";

let curKeyData = ref({})
</script>