<template>
  <canvas ref="canvas" @touchstart="touchstart" @touchmove="touchmove" @touchend="touchend" ></canvas>
</template>
<script>
/**
 * @date 2020-5-26
 * @description 刮刮乐刮奖层
 * @emit {firstClick：第一次点击画布， showAll：画布清空后}
 */
export default {
  props: {
    disabled: { // 禁止刮动
      type: Boolean,
      default: false
    },
    arearatio: { // 刮刮乐处于低于该值清空画布
      type: Number,
      default: 0.7
    },
    showText: { // 圆圈中显示的文字
      type: String,
      default: 'MIYA'
    }
  },
  data () {
    return {
      ctx: null, // 画布上下文
      isPressDowm: false, // 判断点击
      firstClick: true, // 只触发一次第一次点击事件
      clearAll: true, // 只触发一次清空画布事件
      oldMoveCoor: [], // 保存移动时的坐标，用于解决移动过快没有连上
      radiu: 30 // 清除的半径
    }
  },
  mounted () {
    this.initCanvas()
  },
  methods: {
    toCurPX (px) { // 轉換為當前屏幕大小的像素
      return px / (750 / 100) * (window.innerWidth / 100);
    },
    // 初始化
    initCanvas () {
      this.canvas = this.$refs.canvas;
      this.canvas.width = this.canvas.parentElement.offsetWidth; // 設置畫布寬度
      this.canvas.height = this.canvas.parentElement.offsetHeight; // 設置畫布高度
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = '#dcdcdc';  // 設置底色
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // 填充底色
      for(let row = 0; row < 10; row++) { // 生成MIYA logo並繪製
        let y = this.canvas.height * row * 0.2 + (this.canvas.height * 0.1); // 計算y軸
        for (let col = 0; col < 6; col++) {
          let x = this.canvas.width * col *  0.2 - (row % 2 ? this.canvas.width * 0.1 : 0); // 計算x軸
          this.ctx.beginPath();
          this.ctx.arc(x, y, this.toCurPX(40), 0, Math.PI * 2, 0); // 画圆
          this.ctx.fillStyle = '#e9e9e9';
          this.ctx.fill();
          this.ctx.font = `${ this.toCurPX(28) }px PingFang SC`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = '#dcdcdc';
          this.ctx.fillText(this.showText, x, y); // 繪製文字
          this.ctx.beginPath();
        }
      }
    },
    // 在画布按下
    touchstart (event) {
      console.log(this.disabled);
      if (this.disabled || !this.clearAll) return;
      if (this.firstClick) {
        this.$emit('firstClick'); // 触发第一次点击画布事件
        this.firstClick = false;
      }
      this.isPressDowm = true;
      this.ctx.globalCompositeOperation = 'destination-out';
      event.stopPropagation();
    },
    // 在画布移动
    touchmove (event) {
      if (!this.isPressDowm) return;
      if (this.disabled || !this.clearAll) return;
      let curX = event.changedTouches[0].pageX - this.getCanvasOffset().left; // 获取当前坐标X
      let curY = event.changedTouches[0].pageY - this.getCanvasOffset().top; // 获取当前坐标Y
      let step = this.toCurPX(this.radiu); // 刮开的半径
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
    },
    // 在离开画布
    touchend (event) {
      if (this.disabled || !this.clearAll) return;
      this.isPressDowm = false;
      let aear = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.filter(item => !!item).length // 计算画布当前所有像素
      console.log('剩余未刮区域：', (aear / 4 ) / (this.canvas.width * this.canvas.height));
      if (((aear / 4 ) / (this.canvas.width * this.canvas.height) <  this.arearatio) && this.clearAll) { // 小于一定面积比例清空
        this.ctx.globalCompositeOperation="source-over";
        this.ctx.clearRect(0, 0, this.canvas.width , this.canvas.height);
        this.$emit('showAll'); // 触发清空图层事件
        this.clearAll = false;
      }
      this.oldMoveCoor.length = 0;
      event.stopPropagation();
    },
    // 重新初始化
    reload () {
      this.firstClick = true;
      this.clearAll = true;
      this.initCanvas();
    },
    // 计算画布离页面顶部偏移量
    getCanvasOffset () {
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
  },
}
</script>
<style lang="scss" scoped>
canvas {
  border-radius: 15px;
  // width:100%;
  // height:100%;
}
</style>