(async function (_this) {
  if (!_this.injectEnd) {
    _this.injectEnd = true
    window.addEventListener('focus', (event) => {
      chrome?.runtime?.sendMessage({type: 'contextMenus', data: location.href});
    })
    document.onvisibilitychange = function () {
      if (document.visibilityState === 'visible') {
        chrome?.runtime?.sendMessage({type: 'contextMenus', data: location.href});
      }
    }
  }
})(window)