
  
// 獲取url參數
export function getUrlParam(searchKey, url) {
  if (import.meta.env.SSR && !url) {
    return
  }
  let urlObj  = new URL(url || location.href);
  let searchParam = urlObj.searchParams;
  if (searchKey) {
    return searchParam.get(searchKey)
  }
  let arr = [];
  searchParam.forEach((value, key) => {
    arr.push({key, value})
  })
  return arr;
}

// 設置url參數
export function setUrlParam(url, key, val) { 
  let urlObj = new URL(url);
  let searchParam = urlObj.searchParams;
  searchParam.set(key, val);
  return urlObj.toString();
}

// 隨機生成名字
export function random(prefix, randomLength) {
  // 兼容更低版本的默认值写法
  prefix === undefined ? prefix = "" : prefix;
  randomLength === undefined ? randomLength = 8 : randomLength;

  // 设置随机用户名
  // 用户名随机词典数组
  let nameArr = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "g", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
  ]
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

export function dateFromat (time, text) {
  let date = new Date(time);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate() + 1;
  let hour = date.getHours();
  let min = date.getMinutes();
  let secode = date.getSeconds();
  return text
  .replace('Y', year)
  .replace('M', String(month).padStart(2, 0))
  .replace('D', String(day).padStart(2, 0))
  .replace('H', String(hour).padStart(2, 0))
  .replace('m', String(min).padStart(2, 0))
  .replace('s', String(secode).padStart(2, 0))
}

export function getUUID () {
  if (import.meta.env.SSR) {
    return ''
  }
  let uuid = globalThis.localStorage?.getItem('uuid');
  if (uuid) {
    return uuid
  }
  uuid = Array.from(globalThis?.crypto.getRandomValues(new Uint16Array(4)), item => item.toString(16).padStart(4, '0')).join('-') + '-' + Date.now().toString(16);
  globalThis.localStorage?.setItem('uuid', uuid);
  return uuid
}