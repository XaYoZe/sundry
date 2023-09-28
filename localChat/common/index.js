
/**
 * 加密
 * @param {string} data 待加密数据
 * @returns  加密后字符
 */
export function proxyEncode (data) {
  let text = JSON.stringify(data);
  let newArr = [];
  let minNum = Infinity;
  let charCode = 0
  for (let i = 0; i < text.length; i++) {
      charCode = text.charCodeAt(i);
      minNum = charCode < minNum ? charCode : minNum;
      newArr.push(charCode);
  }
  let step = Math.floor(minNum * Math.random());
  let newStr = String.fromCharCode(step);
  newArr.forEach(char => {
    newStr += String.fromCharCode(char - step)
  })
  return newStr
}

/**
 * 解密
 * @param {String} data 待解析字符
 * @returns 解密后字符
 */
export function proxyDecode (data = '') {
  let newStr = ''
  let code = data.charCodeAt(0)
  for (let i = 1; i < data.length; i++) {
      newStr += String.fromCharCode(data.charCodeAt(i) + code)
  }
  return JSON.parse(newStr)
}