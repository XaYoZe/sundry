import { defineStore } from "pinia";
import popupStore from "./popup";
import apiCall, { socket } from '@js/apiCall';
import { getUUID } from '../js/common'
import { reactive  } from "vue";

let dataStore = defineStore('data', {
  state: () => {
    return {
      peer: null,
      offer: null,
      answer: null,
      candidate: null,
      sendChannel: null,
      sendLog: [],
      chatLog: reactive([]),
    }
  },
  actions: {
    async createPeer () {
      this.peer = new RTCPeerConnection();
      console.log(this.peer);
      this.peer.onicecandidate = (event) => {
        if (event.candidate) {
          this.candidate = event.candidate.toJSON();
        }
        console.log('onicecandidate', event);
      }
      return this.peer;
    },
    // 发送端
    async createSender (offer, candidate, uuid) {
      if (import.meta.env.SSR || this.peer) return;
      this.createPeer();
      this.peer.ondatachannel = (event) => {
        // 接收数据通道
        let receiveChannel = event.channel;
        receiveChannel.onmessage = (event) => {
          this.chatLog.push(JSON.parse(event.data));
          console.log('receiveChannel 接收消息', event.data);
        };
        receiveChannel.onopen = () => {
          console.log('接收通道状态: ' + receiveChannel.readyState);
        };
        receiveChannel.onclose = () => {
          console.log('接收通道状态: ' + receiveChannel.readyState);
        };
        this.sendChannel = receiveChannel;
      };
      await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      socket.answer({answer, uuid});
      console.log(answer);
      await this.peer.setLocalDescription(answer);
      await this.peer.addIceCandidate(candidate);
    },
    // 接受端
    async createReceiver () {
      if (import.meta.env.SSR || this.peer) return;
      this.createPeer();
      // 创建数据通道
      let sendChannel = this.peer.createDataChannel('sendDataChannel');
      sendChannel.onopen = () => {
        this.popup.toast('连接成功');
        this.popup.close();
        console.log('发送通道状态: ' + sendChannel.readyState);
      };
      sendChannel.onclose = () => {
        this.popup.toast('断开连接');
        console.log('发送通道状态: ' + sendChannel.readyState);
      };
      sendChannel.onmessage = (event) => {
        this.chatLog.push(JSON.parse(event.data));
        console.log('sendChannel 接受消息', event, this.receiverLog);
      };
      // // 创建SDP offer
      const offer = await this.peer.createOffer();
      this.offer = offer.toJSON();
      this.sendChannel = sendChannel;
      await this.peer.setLocalDescription(offer);
      socket.on('answer',async ({data}) => {
        console.log('socket answer', data);
        await this.peer.setRemoteDescription(data.answer);
      })
    },
    sendData (data) {
      console.log(this.sendChannel);
      if (this.sendChannel) {
        this.sendChannel.send(JSON.stringify({
          name: getUUID(),
          lastTime: new Date().toLocaleString(),
          newMsg: data,
        }))
      }
    }
  },
  getters: {
    popup: () => popupStore(),
    linkParams: (state) => {
      return {
        offer: state.offer,
        answer: state.answer,
        candidate: state.candidate
      }
    },
    uuid: (state) => {
      
    }
  }
})

export default dataStore