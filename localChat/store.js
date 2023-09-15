
 // 用来保存数据
let store = new Proxy({
  _data: {},
  _watch: {}, // 监听值变化列表
  _computed: {},
  _initComputedList: [],
  // 添加监听值变化
  watch: function (name, call) {
    (this._watch[name] || (this._watch[name] = [])).push(call);
  },
  // 值变化后触发事件
  watchChangeEnd: function (name, newVal, oldVal) {
    ((newVal !== oldVal && this._watch && this._watch[name]) || []).forEach(fn => {
      fn(newVal, oldVal)
    })
  },
  // 添加计算属性
  computed: function (name, cb) {
    // let loadComputed
    if (this._data[name]) {
      return console.err('已经存在该属性:', name)
    }
    this._computed[name] = {cb, watchList: [], useList: [], cache: null,init: false};
    return 
  },
  /**
   * 
   * @param {*} attrName 属性名
   * @returns {0|1|2|3} 0: 没有该属性；1：原对象属性，2：数据，3：计算属性
   */
  getAttrType (attrName) {
    if (this.hasOwnProperty(attrName)) {
      return 1
    } else if (this._data.hasOwnProperty(attrName)) {
      return 2
    } else if (this._computed.hasOwnProperty(attrName)) {
      return 3
    }
    return 0
  }
}, {
  get (_this, prop) {
    let attrType = _this.getAttrType(prop);
    let returnValue;
    switch (attrType) {
      case 1:
        returnValue = _this[prop]
        break;
      case 2: // data 有数据
        returnValue = _this._data[prop]
        break;
      case 3: // computed 有数据
        // 没有初始化
        if (!_this._computed[prop].init) {
          // 初始化开始
          _this._initComputedList.push(prop);
          // 获取值
          let cache = _this._computed[prop].cb();
          // 监听列表值变化
          _this._computed[prop].watchList.forEach(watchItem => {
            // 监听列表
            _this.watch(watchItem, (n, o) => {
              let oldVal = _this._computed[prop].cache;
              let newVal = _this._computed[prop].cb()
              _this._computed[prop].cache = newVal;
              console.log(`计算属性: ${prop}:` , oldVal , '->', newVal, `, 导致变化的参数:${watchItem}, `, o, `->`, n)
              _this.watchChangeEnd(prop, newVal, oldVal);
            })
          })
          // 初始化结束
          _this._computed[prop].cache = cache;
          _this._computed[prop].init = true;
          _this._initComputedList.pop();
        }
        // 返回缓存的数据
        returnValue = _this._computed[prop].cache
        break;
      default:
        break;
    }
    // 如果在初始化计算属性中, 将变量名添加至computed监听数组
    if (_this._initComputedList.length) {
      let lastKey = _this._initComputedList.slice(-1)[0]; // 最后初始化的计算属性名
      switch (attrType) {
        case 2: 
          if (!_this._computed[lastKey].watchList.includes(attrName)) {
            _this._computed[lastKey].watchList.push(attrName);
          }
          break
        case 3:
          console.log(attrName, _this._computed[attrName].watchList)
          _this._computed[attrName].watchList.forEach(item => {
            console.log(item)
            if (!_this._computed[lastKey].watchList.includes(item)) {
              _this._computed[lastKey].watchList.push(item);
            }
          })
          break;
        default:
          break;
      }
      _this._computed[lastKey].useList.push(attrName);
    }

    return returnValue
  },
  set (_this, prop, value) {
    // 如果有计算属性
    if (_this._computed[prop]) {
      console.warn('修改了计算属性：' + prop)
      _this._computed[prop].cache = value;
      return value
    }
    let newVal = value;
    let oldVal = _this._data[prop];
    // _this.watchChangeStart(prop, _this._data[prop], val)
    _this._data[prop] = newVal;
    _this.watchChangeEnd(prop, newVal, oldVal)
    return value
  }
});

exports.default = store