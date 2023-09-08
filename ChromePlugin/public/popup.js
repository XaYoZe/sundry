// let searchParams = new URLSearchParams(location.href);
let id = document.querySelector('#id');
let name = document.querySelector('#name');
let errorTip = document.querySelector('#errorTip');
async function clickConfirm() {
  chrome.runtime.sendMessage({
    type: 'getKey',
    data: {
      id: id.value,
      name: name.value,
      // env: searchParams.get('env'),
      // tabId: searchParams.get('tabId'),
    }
  }, async (err) => {
    if (err) {
      errorTip.style.display = 'block';
      console.log("獲取key失敗", err);
      return
    }
    await chrome.tabs.remove((await chrome.tabs.getCurrent()).id);
  })
}