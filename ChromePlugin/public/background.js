class Background {
  popup = {
    width: 500,
    height: 250,
  };
  server = {
    beta: "",
    staging: "",
  };
  whiteList = [
    "http://localhost",
    "http://127.0.0.1",
    "",
    "",
  ];
  whiteListReg = [];
  // 后台地址
  servicesApi = {
    GetActivity: "/services/activity/ActivityExtObj/GetActivity",
    newLogin: "/services/auth/newDev/newLogin",
  };
  // storage数据
  storage = new Proxy(
    {
      set(data) {
        return chrome.storage.local.set(data);
      },
    },
    {
      get(t, key, r) {
        console.log('get', t[key], t, key, r)
        return  t[key] || chrome.storage.local.get(key).then((store) => store[key]);
      },
      set(t, p, v, r) {
        console.log('set', t, p, v, r)
        return chrome.storage.local.set({ [p]: v });
      },
    }
  );
  constructor() {
    // // 注册监听storage修改
    chrome.storage.onChanged.addListener(this.storageChange.bind(this));
    // 注册插件安裝成功
    chrome.runtime.onInstalled.addListener(this.installed.bind(this));
    // // 注册监听tab更新
    chrome.tabs.onUpdated.addListener(this.tabUpdate.bind(this));
    // // 注册监听接受消息
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    // // 注册監聽右鍵點擊
    chrome.contextMenus.onClicked.addListener(this.contextMenusClick.bind(this));
    // // 注册监听tab切换
    chrome.tabs.onActivated.addListener(this.tabChange.bind(this));
  }
  // 右键菜单点击处理
  async contextMenusClick(info, tab) {
    console.log(info, tab)
    let [env, type] = info.menuItemId.split("_");
    switch (type) {
      case "1":
        this.getKey({ env, tabId: tab.id });
        break;
      case "2":
        let windowItem = await chrome.windows.get(tab.windowId);
        chrome.windows.create({
          url: `index.html#/popup?env=${env}&type=${type}&tabId=${tab.id}`,
          width: this.popup.width,
          height: this.popup.height,
          left: Math.ceil(windowItem.left + windowItem.width / 2 - this.popup.width / 2),
          top: Math.ceil(windowItem.top + windowItem.height / 2 - this.popup.height / 2),
          type: "popup",
        });
        break;
      default:
        break;
    }
    return true;
  }
  // tab切换处理
  async tabChange(tab) {
    // console.log(tab)
  }
  // tab更新处理
  async tabUpdate(tabId, changeInfo, tab) {
    console.log('tab更新处理', tabId, changeInfo, tab)
    if (tab.status === "complete" && /https?:\/\//.test(tab.url) && tab.id) {
      chrome.scripting
        .executeScript({
          injectImmediately: true,
          target: { tabId: tab.id },
          files: ["injectScript.js"],
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  // storage修改处理
  storageChange({server, whiteList}) {
    console.log('storage修改处理', server, whiteList)
    if (server) {
      console.log("修改服务器", whiteList);
      this.server = server.newValue;
    }
    if (whiteList) {
      console.log("修改白名單", whiteList);
      this.whiteList = whiteList.newValue;
      this.whiteListReg = this.whiteList.map(item => new RegExp(item));
    }
  }
  // 插件安裝成功
  async installed() {
    console.log(this, this.storage, this.server)
    this.storage.server = this.server;
    this.storage.whiteList = this.whiteList;
    this.whiteListReg = this.whiteList.map(item => new RegExp(item));

    console.log('插件安装成功');
    this.contextMenus();
    // chrome.action.setBadgeText({text: 'MIYA'})
  }
  // 接受消息处理
  onMessage({ type, data }, sender, sendResponse) {
    console.log(this);
    switch (type) {
      case "getKey":
        try {
          this.getKey(data);
          sendResponse();
        } catch (ere) {
          sendResponse(err);
          return;
        }
        break;
      case "history":
        this.storage.history.then(({ history }) => {
          sendResponse(history);
        });
        break;
      case "get":
        this.storage[data].then((res) => {
          sendResponse(res);
        });
        break;
      case "set":
        console.log(this.storage.set);
        this.storage.set(data).then(() => {
          sendResponse(true);
        });
        break;
      case "contextMenus":
        let visible = this.testContextMenu(data);
        console.log('显示右键', visible)
        chrome.contextMenus.update("MIYA", { visible });
        sendResponse();
        break;
    }
    return true;
  }
  // 创建右鍵菜單
  contextMenus() {
    let option = [
      { id: "1", name: "隨機" },
      { id: "2", name: "手動" },
    ];
    let ctxId = chrome.contextMenus.create({
      title: "MIYA",
      id: "MIYA",
    });
    ['beta', 'staging'].forEach(env => {
      option.forEach((item, index) => {
        chrome.contextMenus.create({
          title: `${env}_${item.name}`,
          id: `${env}_${item.id}`,
          parentId: ctxId,
        });
      });
    })
  }
  // 获取key
  async getKey({ id, name, env, tabId }) {
    let historyStore = await this.storage.history;
    let link = `${this.server[env]}${this.servicesApi.newLogin}?flash=true&`;
    if (id) {
      link += `id=${id}`;
    } else {
      name = name || this.random(10);
      link += `name=${name}`;
    }
    let key = await fetch(link).then((res) => res.text());
    let { uid } = JSON.parse(atob(key.split(".")[1]));
    let history = historyStore?.history || [];
    history.unshift({ env, name, key, uid, create: Date.now() });
    await (this.storage.history = history);
    await this.jumpUrl(tabId, { key });
    return key;
  }

  // 跳轉鏈接
  async jumpUrl(tabId, params = {}) {
    let targetTab = await chrome.tabs.get(+tabId);
    let url = targetTab.url;
    for (let key in params) {
      url = this.setUrlParam(url, key, params[key]);
    }
    await chrome.tabs.update(targetTab.id, {
      url,
      active: true,
    });
  }

  // 隨機生成名字
  random(prefix, randomLength) {
    prefix === undefined ? (prefix = "") : prefix;
    randomLength === undefined ? (randomLength = 8) : randomLength;
    let str = prefix;
    // 字符编码
    let strArr = [
      ['0'.charCodeAt(0), 10], // 数字
      ['a'.charCodeAt(0), 26], // 小写字母
      ['A'.charCodeAt(0), 26]  // 大写字母
    ];
    for (var i = 0; i < randomLength; i++) {
      // 随机生成index
      let index = Math.floor(Math.random() * strArr.length);
      let charCode = strArr[index][0] + Math.floor(Math.random() * strArr[index][1]);
      str += String.fromCharCode(charCode)
    }
    return str
  }

  // 獲取url參數
  getUrlParam(url, searchKey) {
    let urlObj = new URL(url);
    let searchParam = urlObj.searchParams;
    if (searchKey) {
      return searchParam.get(searchKey);
    }
    let arr = [];
    searchParam.forEach((value, key) => {
      arr.push({ key, value });
    });
    return arr;
  }

  // 設置url參數
  setUrlParam(url, key, val) {
    let urlObj = new URL(url);
    let searchParam = urlObj.searchParams;
    searchParam.set(key, val);
    return urlObj.toString();
  }
  testContextMenu (url) {
    return this.whiteListReg.some((item) => item.test(url));
  }
}
let background = new Background();
