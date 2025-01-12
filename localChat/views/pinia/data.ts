import { defineStore } from "pinia";
import { usePopupStore } from "../components/PopupCtrl";
import apiCall, { socket } from "@js/apiCall";
import { getUUID } from "../js/common";
import { computed, reactive, ref } from "vue";

let dataStore = defineStore("data", () => {
  const peer = ref(null);
  const offer = ref(null);
  const answer = ref(null);
  const candidate = ref([]);
  const sendChannel = ref(null);
  const sendLog = reactive([]);
  const chatLog = reactive([]);
  const popup = usePopupStore();

  const createPeer = async () => {
    peer.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // 使用公共 STUN 服务器
      ]
    });
    console.log("createPeer", peer.value);
    peer.value.onicecandidate = (event) => {
      if (event.candidate) {
        candidate.value.push(event.candidate.toJSON());
      }
      console.log("onicecandidate", event);
    };
    return peer.value;
  };
  // 发送端
  const createSender = async (offer, candidate, uuid) => {
    if (peer.value) return;
    createPeer();
    peer.value.ondatachannel = (event) => {
      // 接收数据通道
      let receiveChannel = event.channel;
      receiveChannel.onmessage = (event) => {
        chatLog.push(JSON.parse(event.data));
        console.log("receiveChannel 接收消息", event.data);
      };
      receiveChannel.onopen = () => {
        console.log("接收通道状态: " + receiveChannel.readyState);
      };
      receiveChannel.onclose = () => {
        console.log("接收通道状态: " + receiveChannel.readyState);
      };
      sendChannel.value = receiveChannel;
    };
    await peer.value.setRemoteDescription(offer);
    const answer = await peer.value.createAnswer();
    await peer.value.setLocalDescription(answer);
    for (let i in candidate) {
      await peer.value.addIceCandidate(candidate[i]);
    }
    socket.answer({ answer, uuid });
    // console.log('send', { answer, uuid });
    // window.socket = socket
    console.log(answer);
  };
  // 接受端
  const createReceiver = async () => {
    if (peer.value) return;
    createPeer();
    // 创建数据通道
    let receiveChannel = peer.value.createDataChannel("sendDataChannel");
    receiveChannel.onopen = () => {
      popup.toast("连接成功");
      popup.close();
      console.log("发送通道状态: " + receiveChannel.readyState);
    };
    receiveChannel.onclose = () => {
      popup.toast("断开连接");
      console.log("发送通道状态: " + receiveChannel.readyState);
    };
    receiveChannel.onmessage = (event) => {
      chatLog.push(JSON.parse(event.data));
      console.log("sendChannel 接受消息", event);
    };
    // // 创建SDP offer
    offer.value = await peer.value.createOffer();
    console.log("sendChannel-----", receiveChannel)
    sendChannel.value = receiveChannel;
    console.log("-----", offer.value);
    await peer.value.setLocalDescription(offer.value);
    socket.on("answer", async ({ data }) => {
      console.log("socket answer", data);
      await peer.value.setRemoteDescription(data.answer);
    });
  };
  const sendData = (data) => {
    console.log(sendChannel.value);
    if (sendChannel.value) {
      sendChannel.value.send(
        JSON.stringify({
          name: getUUID(),
          lastTime: new Date().toLocaleString(),
          newMsg: data,
        })
      );
    }
  };

  const linkParams = computed(() => {
    return {
      offer: offer.value,
      answer: answer.value,
      candidate: candidate.value,
    };
  });

  return {
    createSender,
    createReceiver,
    sendData,
    linkParams,
  };
});

export default dataStore;

declare module "vue" {
  function inject(key: "dataStore"): ReturnType<typeof dataStore>;
}
