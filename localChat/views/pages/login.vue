<template>
  <div class="login_page">
    <div class="login_bg"></div>
    <div class="login_left_panel"></div>
    <div class="login_right_panel">
      <div class="login_form">
        <div class="login_title">登陆</div>
        <div class="form_row">
          <label>账号: <input type="text" v-model="username" placeholder="输入账号" /></label>
        </div>
        <div class="form_row">
          <label>密码: <input type="password" v-model="password" placeholder="输入密码" /></label>
        </div>
        <div class="form_row">记住我: <input type="checkbox" /></div>
        <div class="form_row"><a href="">注册</a> <a href="">忘记密码</a></div>
        <div class="form_row">
          <button class="login_btn" @click="clickLogin">登陆</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import useDataStore from "../pinia/data";
import { socket } from '../js/apiCall';

import { useRouter } from "vue-router";
import { ref, inject } from "vue";

const popupStore = inject('popupStore')
const router = useRouter();

const username = ref("");
const password = ref("");

const clickLogin = () => {
  if (!username.value || !password.value) {
    popupStore.toast('請輸入完整的賬號密碼', 'error');
    return
  }
  socket.login({
    id: username.value,  // 'admin',
    psw: password.value // '123456'
  }).then(res => {
    console.log(11111111, res)
    router.push('home')
  }).catch(err => {
    // popupStore.tip({text: err, type: 'error'})
  })
}

setTimeout(() => {}, 2000);
console.log("当前页面登陆页");
</script>
<style lang="scss">
.login_page {
  user-select: none;
  position: relative;
  .login_bg {
    position: absolute;
    filter: blur(5px);
    width: 100%;
    height: 100%;
    background: url(../assets/image/bg_login.jpg) no-repeat top center / cover;
  }
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  .login_left_panel {
    width: auto;
    flex: 1;
  }
  .login_right_panel {
    margin-right: 10px;
    width: 300px;
    height: calc(100% - 20px);
    border-radius: 15px;
    font-weight: 600;
    color: #fff;
    display: flex;
    position: relative;
    align-items: center;
    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #87ceeb88;
      filter: blur(10px);
    }
    .login_form {
      position: relative;
      z-index: 1;
      width: 300px;
      .login_title {
        text-align: center;
        font-size: 50px;
        margin-bottom: 20px;
      }
      .form_row {
        padding-left: 20px;
        min-height: 32px;
        margin-bottom: 10px;
        line-height: 32px;
        input:not([type="checkbox"]) {
          color: #eee;
          &::placeholder {
            color: #efefef;
          }
          height: 32px;
          background: #87ceeb88;
          padding-left: 10px;
          width: 200px;
        }
      }
      .login_btn {
        margin: 0 auto;
        font-size: 20px;
        width: 120px;
        height: 40px;
        line-height: 40px;
        border-radius: 5px;
        font-weight: 600;
        background: rgba(31, 92, 206, 0.8);
        display: block;
        color: #fff;
      }
    }
  }
}
</style>
