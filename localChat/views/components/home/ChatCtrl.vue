<template>
  <div class="chat_ctrl">
    <div class="chat_tools"></div>
    <div class="chat_input">
      <textarea v-model="text" name="" id="" cols="30" rows="10"></textarea>
      <!-- <input type="text" style="background-color: antiquewhite;"> -->
    </div>
    <div class="chat_send">
      <div class="send_btn" @click="onSend(text)">发送</div>
    </div>
    <!-- <div class="chat_send"> -->
      <!-- <div>
        <div>被连接端</div>
        <div class="send_btn" @click="onStart">start</div>
        <div class="send_btn" @click="onAnswer(text)">answer</div>
      </div>
      <div>
        <div>连接端</div>
        <div class="send_btn" @click="onOffer(text)">offer</div>
        <div class="send_btn" @click="onCandidate(text)">candidate</div>
      </div> -->
      <!-- <div class="send_btn" @click="onSend(text)">send</div> -->
    <!-- </div> -->
  </div>
</template>
<script setup>
import apiCall, { socket } from '@js/apiCall';
import { ref, onMounted, inject } from 'vue';


const popup = inject('popupStore');
const dataStore = inject('dataStore');

const text = ref('')
const confrim = () => {
  socket.a({text: text.value})
}


let pc = null;
let sendChannel = null;
let receiveChannel = null;

function createPeerConnection() {
  pc = new RTCPeerConnection();
  pc.onicecandidate = e => {
    const message = {
      type: 'candidate',
      candidate: null,
    };
    if (e.candidate) {
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    console.log('onicecandidate',e, message)
    // signaling.postMessage(message);
  };
  return pc
}
function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    // dataChannelSend.disabled = false;
    // dataChannelSend.focus();
    // sendButton.disabled = false;
    // closeButton.disabled = false;
  } else {
    // dataChannelSend.disabled = true;
    // sendButton.disabled = true;
    // closeButton.disabled = true;
  }
}

function onSendChannelMessageCallback(event) {
  console.log('Received Message', event);
  // dataChannelReceive.value = event.data;
}

const onStart = async () => {
  console.log('cccc')
  await createPeerConnection();
  sendChannel = pc.createDataChannel('sendDataChannel');
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onmessage = onSendChannelMessageCallback;
  sendChannel.onclose = onSendChannelStateChange;

  const offer = await pc.createOffer();
  // signaling.postMessage({type: 'offer', sdp: offer.sdp});
  console.log(offer.toJSON());
  await pc.setLocalDescription(offer);
}

function onReceiveChannelMessageCallback(event) {
  console.log('Received Message',  event.data);
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
  if (readyState === 'open') {

  } else {
    
  }
}

function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

const onOffer = async (offer) => {
  console.log('连接其它');
  if (pc) {
    console.error('existing peerconnection');
    return;
  }
  await createPeerConnection();
  pc.ondatachannel = receiveChannelCallback;
  await pc.setRemoteDescription(JSON.parse(offer));

  const answer = await pc.createAnswer();
  console.log({type: 'answer', sdp: answer.sdp});
  await pc.setLocalDescription(answer);
}

const onAnswer = async (answer) => {
  console.log('onAnswer', answer)
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  await pc.setRemoteDescription(JSON.parse(answer));
}

const onCandidate = async (candidate) => {
  candidate = JSON.parse(candidate);
  console.log('onCandidate', candidate)
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  if (!candidate.candidate) {
    await pc.addIceCandidate(null);
  } else {
    await pc.addIceCandidate(candidate);
  }
}


function onSend(data) {
  dataStore.sendData(data);
  // console.log('Sent Data: ' + data);
}

onMounted(async () => {
})

</script>
<style lang="scss">
.chat_ctrl {
      width: 100%;
      .chat_input {
        display: flex;
        textarea {
          width: 100%;
          height: 200px;
          background: rgba(210, 105, 30, 0.432);
          color: #fff;
          font-size: 20px;
          line-height: 26px;
          border-radius: 5px;
          resize: none;
          margin: 0 auto;
          padding: 10px;
        }
      }
      .chat_send {
        display: flex;
        padding: 10px 0;
        .send_btn {
          margin-left: auto;
          width: 120px;
          height: 30px;
          font-size: 16px;
          color: cadetblue;
          background: #eee;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1px 1px 5px #aaa;
          font-weight: 600;
        }
      }
    }
</style>