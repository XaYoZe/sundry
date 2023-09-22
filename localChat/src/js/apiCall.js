
// const config = {}

/* 接口调用, sPb已兼容
 * 使用: 
 * import API from '@apiCall' // 引入该文件
 * API.GetActivity(data?, option?) // 使用GetActivity接口  data: 数据, * option: 配置项requeryParams
 */

import { proxyEncode, proxyDecode } from '@common';

const apiCall = new Proxy({}, {
  get (_this, prop) {
    // 如果已有方法屬性, 則返回已有方法屬性
    if (_this[prop]) {
      return _this[prop]
    }
    return (data = {}, options = {}) => {
      // 構建參數
      let params = Object.assign({
        prop,
        awaitKey: true,
        data,
      }, options)
      return fetch('/api/proxy', {
        method: 'post',
        body: proxyEncode(params),
        headers: {'Content-Type': 'application/octet-stream'}
      }).then(res => res.text()).then(res => {
        return proxyDecode(res);
      })
    }
  }
})

export default apiCall;
