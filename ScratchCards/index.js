(function (win) {
  function ScratchCards (option) {
    this.canvas = option.el || {};
    this.ctx = null;
    this.canvas.width = this.canvas.offsetWidth; // 設置畫布寬度
    this.canvas.height = this.canvas.offsetHeight; // 設置畫布高度
    this.isPressDowm = false; // 是否在畫布上按下
    this.isPhone = option.isPhone || false; // 是否是移動端
    this.radius = option.radius || 15; // 清除半徑
    this.disabled = option.disabled || false; // 禁用
    this.clearAll = false; // 已經清除所有
    this.showText = 'LALA'; // logo文本
    this.oldMoveCoor = []; // 保存移動坐標
    this.arearatio = option.arearatio || 0.7; // 清空畫布觸發值
    this.events = {}; // 保持on綁定的事件
    if (!this.canvas.getContext) throw('請在new時傳入canvas元素');
    this.initCanvas();
    this.initEvent();
  }
  // 轉換為當前屏幕大小的像素
  ScratchCards.prototype.toCurPX = function (px) {
    if (this.isPhone) {
      return px / (750 / 100) * (window.innerWidth / 100);
    }
    return px;
  }
  // 初始化畫布
  ScratchCards.prototype.initCanvas = function () {
    this.ctx = this.canvas.getContext('2d');
    // 設置底色
    this.ctx.fillStyle = '#dcdcdcdc';
    // 填充底色
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // 生成logo並繪製
    for(let row = 0; row < 10; row++) {
      let y = this.canvas.height * row * 0.2 + (this.canvas.height * 0.1); // 計算y軸
      for (let col = 0; col < 6; col++) {
        let x = this.canvas.width * col *  0.2 - (row % 2 ? this.canvas.width * 0.1 : 0); // 計算x軸
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.toCurPX(40), 0, Math.PI * 2, 0); // 画圆
        this.ctx.fillStyle = '#cdcdcd';
        this.ctx.fill();
        this.ctx.font = `${ this.toCurPX(28) }px PingFang SC`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#dcdcdc';
        this.ctx.fillText(this.showText, x, y); // 繪製文字
        this.ctx.beginPath();
      }
    }
  }
  // 初始化事件
  ScratchCards.prototype.initEvent = function () {
    let _this = this;
    if (this.isPhone) { // 移動端事件註冊
      this.canvas.ontouchstart = function (event) { _this.down(event) };
      this.canvas.ontouchend = function (event) { _this.up(event) };
      this.canvas.ontouchmove = function (event) { _this.move(event) };
    } else { // PC端事件註冊
      this.canvas.onmousedown =  function (event) { _this.down(event) };
      this.canvas.onmouseup =  function (event) { _this.up(event) };
      this.canvas.onmousemove =  function (event) { _this.move(event) };
    }
  }
  //  畫布按下事件
  ScratchCards.prototype.down = function (event) {
    console.log(this.disabled || this.clearAll);
    if (this.disabled || this.clearAll) return;
    this.isPressDowm = true;
    this.ctx.globalCompositeOperation = 'destination-out';
    event.stopPropagation();
  }
  // 畫布移動事件
  ScratchCards.prototype.move = function (event) {
    if (!this.isPressDowm) return;
    if (this.disabled || this.clearAll) return;
    let curX = (event.pageX || event.changedTouches[0].pageX) - this.getCanvasOffset().left; // 获取当前坐标X
    let curY = (event.pageY || event.changedTouches[0].pageY) - this.getCanvasOffset().top; // 获取当前坐标Y
    let step = this.toCurPX(this.radius); // 刮开的半径
    if (this.oldMoveCoor[0] && this.oldMoveCoor[1]) { // 解决移动过快，刮的地方没有连上的问题
      this.ctx.beginPath();
      this.ctx.lineWidth = step * 2; // 線條寬
      this.ctx.moveTo(...this.oldMoveCoor); // 在上個點的坐標
      this.ctx.lineTo(curX,curY); // 移動到當前點的坐標
      this.ctx.stroke();
      this.ctx.closePath();
    }
    this.ctx.beginPath();
    this.ctx.arc(curX, curY, step, 0, Math.PI * 2, 0);
    this.ctx.fill();
    this.ctx.closePath();
    this.oldMoveCoor[0] = curX; // 保存當前所在坐標X
    this.oldMoveCoor[1] = curY; // 保存當前所在坐標Y
    event.stopPropagation();
    event.preventDefault();
    // console.log('移动', curX, curY ,event.changedTouches[0])
  }
  // 畫布彈起事件
  ScratchCards.prototype.up = function  (event) {
    if (this.disabled || this.clearAll) return;
    this.isPressDowm = false;
     // 计算画布当前所有像素, 每像素佔4個值, 為rgba
    let aear = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.filter(item => !!item).length;
     // 小于一定面积比例清空
    if (((aear / 4 ) / (this.canvas.width * this.canvas.height) <  this.arearatio)) {
      this.ctx.globalCompositeOperation="source-over";
      this.ctx.clearRect(0, 0, this.canvas.width , this.canvas.height); 
       // 触发綁定事件中的clear事件
       this.clearAll = true;
       this.events.clear && this.events.clear();
    }
    this.oldMoveCoor.length = 0;
    event.stopPropagation();
  }
  // 獲取畫布所在位置
  ScratchCards.prototype.getCanvasOffset = function () {
    let dom = this.canvas;
    let top = this.canvas.offsetTop;
    let left = this.canvas.offsetLeft;
    while (dom = dom.parentElement) {
      if (window.getComputedStyle(dom, null).position != 'static') { // 父级元素有设置定位会影响offsetTop的数值
        top += dom.offsetTop;
        left += dom.offsetLeft;
      }
    }
    return {top, left};
  }
  // 綁定事件
  ScratchCards.prototype.on = function (name, fn) {
    this.events[name] = fn;
  }
  ScratchCards.prototype.reset = function (name, fn) {
    this.clearAll = false;
    this.disabled = false; // 禁用
    this.oldMoveCoor = [];
    this.isPressDowm = false;
    this.initCanvas();
  }
  win.ScratchCards = ScratchCards;
})(window)