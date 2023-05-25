const config = {
  keyApiUrl: {
    beta: "",
    staging: "",
  },
  whiteList: [
    /http\:\/\/localhost/,
    /http\:\/\/127.0.0.1/,
  ]
};
let popup = {
  width: 500,
  height: 250,    
};

function testWhiteList (url) {
  return config.whiteList.some(item => {
    return item.test(url)
  })
}

// 獲取url參數
function getUrlParam(url, searchKey) {
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
function setUrlParam(url, key, val) {
  let urlObj = new URL(url);
  let searchParam = urlObj.searchParams;
  searchParam.set(key, val);
  return urlObj.toString();
}

// 隨機生成名字
function random(prefix, randomLength) {
  // 兼容更低版本的默认值写法
  prefix === undefined ? (prefix = "") : prefix;
  randomLength === undefined ? (randomLength = 8) : randomLength;

  // 设置随机用户名
  // 用户名随机词典数组
  let nameArr = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
    [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "g",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ],
  ];
  // 随机名字字符串
  let name = prefix;
  // 循环遍历从用户词典中随机抽出一个
  for (var i = 0; i < randomLength; i++) {
    // 随机生成index
    let index = Math.floor(Math.random() * 2);
    let zm = nameArr[index][Math.floor(Math.random() * nameArr[index].length)];
    // 如果随机出的是英文字母
    if (index === 1) {
      // 则百分之50的概率变为大写
      if (Math.floor(Math.random() * 2) === 1) {
        zm = zm.toUpperCase();
      }
    }
    // 拼接进名字变量中
    name += zm;
  }
  // 将随机生成的名字返回
  return name;
}

// 跳轉鏈接
async function jumpUrl (tabId, url) {
  let targetTab = await chrome.tabs.get(+tabId);
  await chrome.tabs.update(targetTab.id, {
    url: url,
    active: true,
  });
}
// 獲取key
async function getKey({ id, name, env, tabId }) {
  let historyStore = await chrome.storage.local.get("history");
  let link = `${config.keyApiUrl[env]}?flash=true&`;
  if (id) {
    link += `id=${id}`;
  } else {
    name = name || random(10);
    link += `name=${name}`;
  }
  let key = await fetch(link).then((res) => res.text());
  console.log(key);
  let { uid } = JSON.parse(atob(key.split(".")[1]));
  let history = historyStore.history || [];
  history.unshift({ env, name, key, uid, create: Date.now() });
  await chrome.storage.local.set({ history });
  await jumpUrl(tabId, setUrlParam(targetTab.url, "key", key))
  return key;
}

// 插件安裝成功
chrome.runtime.onInstalled.addListener(async () => {
  
});
// 接受消息
chrome.runtime.onMessage.addListener(({ type, data }, sender, sendResponse) => {
  console.log("接受消息", type, data, sender);
  switch (type) {
    case "getKey":
      try {
        getKey(data)
        sendResponse();
      } catch (ere) {
        sendResponse(err);
        return;
      }
      break;
    case 'history': 
      chrome.storage.local.get("history").then(({history}) => {
        console.log(history);
        sendResponse(history)
      });
      break
  }
  return true
});


//#region 右鍵菜單處理
// 生成右鍵菜單
let isCreateMenu = false;
function contextMenus (type) {
  if (type) {
    if (isCreateMenu) return;
    isCreateMenu = true;
    let option = [
      { id: "1", name: "隨機" },
      { id: "2", name: "手動" },
    ];
    option.forEach((item, index) => {
      chrome.contextMenus.create({
        title: "beta_" + item.name,
        // parentId: betaRoot,
        id: "beta_" + item.id,
      });
    });
    option.forEach((item, index) => {
      chrome.contextMenus.create({
        title: "staging_" + item.name,
        // parentId: stagingRoot,
        id: "staging_" + item.id,
      });
    });
    return
  }
  isCreateMenu = false;
  chrome.contextMenus.removeAll();
}

// 監聽右鍵點擊
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  let [env, type] = info.menuItemId.split("_");
  switch (type) {
    case "1":
      getKey({ env, tabId: tab.id });
      break;
    case "2":
      chrome.windows.create({
        url: `index.html#/popup?env=${env}&type=${type}&tabId=${tab.id}`,
        width: popup.width,
        height: popup.height,
        left: Math.ceil(tab.width / 2 - popup.width / 2),
        top: Math.ceil(tab.height / 2 - popup.height / 2),
        type: "popup",
      });
      break;
    default:
      break;
  }
});

// 選中tab
chrome.tabs.onActivated.addListener(async ({tabId}) => {
  let actTab = await chrome.tabs.get(tabId);
  if (testWhiteList(actTab.url)) {
    contextMenus(true);
    return
  }
  contextMenus(false);
})

// tab更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && testWhiteList(tab.url)) {
    contextMenus(true);
    return
  }
  contextMenus(false);
})
//#endregion