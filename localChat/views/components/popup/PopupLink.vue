<template>
  <div class="popup popup_link">
    <div class="popup_close" @click="$emit('close')"></div>
    <div class="popup_content">
      <div class="qrcode">
        <img :src="qrcodeSrc" alt="">
      </div>
      <!-- <VueQrcode :value="codeValue"></VueQrcode> -->
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, inject, watch, computed } from 'vue';
import { getUUID } from '@js/common';
import QRCode from 'qrcode'

const dataStore = inject('dataStore');
// const codeValue = ref(location.href);
const qrcodeSrc = ref(null);

dataStore.createReceiver();

const linkParams = computed(() => dataStore.linkParams);
watch(linkParams, (val) => {
  console.log('linkParams', val);
  if (val.offer && val.candidate) {
    let href = `${location.origin}?uuid=${getUUID()}&offer=${encodeURIComponent(JSON.stringify(val.offer))}&candidate=${encodeURIComponent(JSON.stringify(val.candidate))}`;
    console.log(href, val)
    QRCode.toDataURL(href).then(url => {
      qrcodeSrc.value = url;
      return url
    })
    .catch(err => {
      console.error(err)
    })
  }
}, {immediate: true})


</script>
<style lang="scss">
.popup_link {

}
</style>
