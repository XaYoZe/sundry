
class Promise1 {
  // pending | rejected | fulfilled
  state;
  isResult = false;
  result;
  listenerList = [];
  error = null;
  then = null;
  catch = null;
  finally = null;
  constructor(fn) {
    this.then = (cb, cb2) => {
        this.listenerList.push({type: 'then', cb});
        if (cb2) {
          this.listenerList.push({type: 'catch', cb});
        }
        if (this.isResult) {
          this.resolve(this.result);
        }
        return this
    }
    this.catch = (cb) => {
      this.listenerList.push({type: 'catch', cb});
      if (this.isResult && this.error) {
        this.reject(this.error);
      }
      return this;
    }
    this.finally = (cb) => {
      this.listenerList.push({type: 'finally', cb});
      if (this.isResult || this.error) {
        this.resolve(this.isResult || this.error);
      }
      return this;
    }
    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
      this.state = 'pending';
    } catch (err) {
      this.reject(err);
    }
    return this;
  }
  async callEventList (type, res, index) {
    if (this.listenerList.length && this.listenerList[index]) {
      if (type === 'then' || type === 'finally') {
        this.state = 'fulfilled'
      } else {
        this.state = 'rejected'
      }
      let resolveCallback = this.listenerList[index];
      // 類型相同執行
      if (resolveCallback.type === type) {
        try {
          let thenRes = await resolveCallback.cb(res);
          this.callEventList('then', thenRes, index + 1);
        } catch (err) {
          this.callEventList('catch', err, index);
        }
      // 如果為finally 則執行
      } else if (resolveCallback.type === 'finally') {
        try {
          await resolveCallback.cb();
          this.callEventList('then', res, index  + 1);
        } catch (err) {
          this.callEventList('catch', err, index);
        }
      } else {
        // 類型不同繼續查找
        this.callEventList(type, res, index + 1);
        // console.log(resolveCallback.type, type, res, index + 1)
      }
    } else {
      this.state = 'pending'
    }
  }
  async resolve(res) {
    this.isResult = true;
    this.result = res;
    this.callEventList('then', res, 0);
  }
  async reject(err) {
    this.isResult = true;
    this.error = err;
    this.callEventList('catch', err, 0);
  }
}