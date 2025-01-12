<template>
  <div class="error" >
    <div class="error_bg"></div>
    <div class="error_info">
      <div>404</div>
      <div>页面不存在</div>
    </div>
  </div>
</template>
<script lang="ts" setup>

</script>
<style scoped lang="scss">
.error {
  height: 100%;
  width: 100%;
  position: relative;
  .error_bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    filter: blur(10px);
    background: url(@image/bg_error.jpg) no-repeat top center / cover;
  }
  .error_info {
    background: linear-gradient(90deg, #96ddfc, #e73057);
    text-shadow: #4776B0 0px 0px 5px;
    background-clip: text;
    color: transparent;
    font-weight: 800;
    width: 500px;
    font-size: 50px;
    position: absolute;
    left: 50%;
    top: 50%;
    text-align: center;
    transform: translate(-50%, -100%);
    div:first-child {
      font-size: 100px;
      margin-bottom: 20px;
    }
  }
  
}
</style>
