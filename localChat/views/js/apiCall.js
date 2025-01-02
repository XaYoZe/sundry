// const config = {}

/* 接口调用, sPb已兼容
 * 使用:
 * import API from '@apiCall' // 引入该文件
 * API.GetActivity(data?, option?) // 使用GetActivity接口  data: 数据, * option: 配置项requeryParams
 */

import { proxyEncode, proxyDecode } from "@common";
import { getUUID } from "./common.js";

let uuid = getUUID();

const apiCall = import.meta.env.SSR
  ? {}
  : new Proxy(
      {},
      {
        get(_this, prop) {
          // 如果已有方法屬性, 則返回已有方法屬性
          if (_this[prop]) {
            return _this[prop];
          }
          return (data = {}, options = {}) => {
            // 構建參數
            let params = Object.assign(
              {
                prop,
                awaitKey: true,
                data,
              },
              options
            );
            return fetch("/api/proxy", {
              method: "post",
              body: proxyEncode(params),
              headers: { "Content-Type": "application/octet-stream" },
            })
              .then((res) => res.text())
              .then((res) => {
                return proxyDecode(res);
              });
          };
        },
      }
    );

class BaseEvent {
  eventTarget = new EventTarget()
  eventCache = {}
  on(type, call) {
    this.eventTarget.addEventListener(type, call);
  }
  un(type, call) {
    this.eventTarget.removeEventListener(type, call);
  }
  callEvent(type, data) {
    let event = this.eventCache[type];
    if (!event) {
      this.eventCache[type] = event = new Event(type);
    }
    event.data = data;
    this.eventTarget.dispatchEvent(event);
  }
}

class SSE extends BaseEvent {
  constructor({ url = "/api/sse", roomId = '123456' } = {}) {
    super();
    this.url = `${url}?roomId=${roomId}`;
    this.init();
  }
  init() {
    this.sse = new EventSource(this.url);
    this.sse.onopen = this.onOpen.bind(this);
    this.sse.onmessage = this.onMessage.bind(this);
    this.sse.onerror = this.onError.bind(this);
  }
  
  onClone() {
    console.log("socket ----> close");
  }
  onOpen(e) {
    console.log("sse ----> open", e);
  }
  onMessage(e) {
    console.log("sse ----> message", e);
  }
  onError(e) {
    console.log("sse ----> error", e);
  }
}

export const sse = new SSE();

class Socket {
  socket = null;
  eventTarget = new EventTarget();
  eventCache = {};
  socketUrl = `ws://${
    globalThis.location ? location.host : "localhost:8080"
  }/api/socket?uuid=${uuid}`;
  status = 0;
  constructor(url) {
    url && (this.socketUrl = url);
    this.init();
  }
  initEvent() {}
  init() {
    if (!import.meta.env.SSR) {
      this.socket = new WebSocket(this.socketUrl);
      this.socket.addEventListener("message", this.onMessage.bind(this), this);
      this.socket.addEventListener("open", this.onOpen.bind(this), this);
      this.socket.addEventListener("error", this.onError.bind(this), this);
      this.socket.addEventListener("close", this.onClone.bind(this), this);
    }
  }
  onOpen(e) {
    this.status = 1;
    console.log("socket ----> open", e);
  }
  onClone() {
    console.log("socket ----> close");
  }
  onError(e) {
    console.log("socket ----> err", e);
  }
  onMessage(msg) {
    console.log(this);
    msg.data.text().then((str) => {
      let data = proxyDecode(str);
      console.log("socket ----> close", data);
      this.callEvent(data.type, data.data);
    });
  }
  on(type, call) {
    this.eventTarget.addEventListener(type, call);
  }
  un(type, call) {
    this.eventTarget.removeEventListener(type, call);
  }
  callEvent(type, data) {
    let event = this.eventCache[type];
    if (!event) {
      this.eventCache[type] = event = new Event(type);
    }
    event.data = data;
    this.eventTarget.dispatchEvent(event);
  }
}

export const socket = new Proxy(new Socket(), {
  get(_this, prop) {
    // 如果已有方法屬性, 則返回已有方法屬性
    if (_this[prop]) {
      return _this[prop];
    }
    return (data = {}, options = {}) => {
      if (_this.status === 1) {
        // 構建參數
        let params = Object.assign(
          {
            type: prop,
            data,
          },
          options
        );
        console.log("发送" + prop);
        _this.socket.send(proxyEncode(params));
        return Promise.resolve(true);
      }
    };
  },
});

export default apiCall;
