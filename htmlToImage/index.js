

class CrtImgLi {
  constructor (option) {
    this.el = option.el; // 父元素
    this.rootStyle = this.getDomStyle(this.el);
    this.images = option.images; // 帶渲染圖片列表
    this.imgWidth = option.imgWidth || 200; // 圖片寬度
    this.imgBoxWidth = 0;
    this.colCount = 0; // 計算列數
    this.imgHeightList = []; // 保存列高度
    this.imgLoadList = []; // 保存圖片加載列表
    this.loadImgIndex = 0;
    this.space = 10; // 間隙
    this.base64Img = [];
    this.loadImg();
  }
  toBase64 () { // 把圖片列表轉base64, 否則保存時圖片不顯示
    return new Promise((resolve, reject) => {
      this.images.forEach((url, index) => {
        let img = new Image();
        img.src = url;
        img.addEventListener('load', () => {
          this.base64Img[index] = CrtImgLi.image2Base64(img);
          if (this.base64Img.length === this.images.length) {
            resolve(this.base64Img);
          }
        })
      })
    })
  }
  async loadImg () { // 加載圖片
    // this.images.forEach(url => { // 直接渲染, 速度快, 無法保存
    (await this.toBase64()).forEach(url => { // 轉為base64再渲染, 速度慢, 可保存圖片
      let imgBox = document.createElement("div");
      let img = new Image();
      img.src = url;
      imgBox.appendChild(img);
      imgBox.style.display = 'none';
      img.addEventListener('load', () => {
        this.renderImg(imgBox);
        this.imgLoadList.push(imgBox);
        imgBox.style.display = '';
      })
      this.el.appendChild(imgBox);
      // 
    })
  }
  renderImg (imgBox) { // 渲染圖片
    if (!imgBox.load) {
      let img = imgBox.childNodes[0];
      imgBox.style.height = Math.ceil(img.height / img.width * this.imgWidth) + "px";
      imgBox.style.width = `${this.imgWidth}px`;
      imgBox.load = true;
    }
    let imgBoxStyle = this.getDomStyle(imgBox);
    if (!this.colCount) { // 計算列數
      this.imgBoxWidth = imgBoxStyle.totalWidth;
      console.log('渲染圖片', this.imgBoxWidth);
      this.colCount = parseInt((this.rootStyle.width + this.space) / (this.imgBoxWidth + this.space));
    }
    if (this.loadImgIndex < this.colCount){ // 第一行
      imgBox.style.left = (imgBoxStyle.totalWidth + this.space) * this.loadImgIndex + this.rootStyle.paddingLeft + "px"; // 設置x軸偏移量
      imgBox.style.top = 0 + this.rootStyle.paddingTop + 'px'; // 設置y軸偏移量
      this.imgHeightList[this.loadImgIndex] = imgBoxStyle.totalHeight + this.rootStyle.paddingTop + this.space; // 保存列高度
    } else { // 第一行後面
      var minIndex = this.imgHeightList.indexOf(Math.min.apply(null, this.imgHeightList)); // 獲取最矮一列索引值
      imgBox.style.left = (imgBoxStyle.totalWidth + this.space) * minIndex + this.rootStyle.paddingLeft  + "px"; // 設置x軸偏移量
      imgBox.style.top = this.imgHeightList[minIndex] + "px"; // 設置y軸偏移量
      this.imgHeightList[minIndex]+=(imgBoxStyle.totalHeight + this.space); // 保存列高度
    }
    this.el.style.height = `${Math.max.apply(null,this.imgHeightList) - this.rootStyle.paddingTop}px`;
    this.loadImgIndex++;
  }
  reload () { // 重新計算順序
    this.rootStyle = this.getDomStyle(this.el);
    if (this.colCount === parseInt((this.rootStyle.width + this.space) / (this.imgBoxWidth + this.space))) {
      return
    }
    this.colCount = 0;
    this.loadImgIndex = 0;
    this.imgHeightList = [];
    this.imgLoadList.forEach(imgBox => {
      this.renderImg(imgBox);
    })
  }
  download (dom) { // 下載圖片
    this.rootStyle = this.getDomStyle(this.el);
    let link = document.querySelector('link'); // 獲取樣式表
    let style = `<style>${Object.values(link.sheet.rules).map(item => item.cssText).join('')}</style>` // 生成樣式
    let svgXml = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    svgXml.setAttribute('xmlns', "http://www.w3.org/2000/svg");
    svgXml.setAttribute('width', "100%");
    svgXml.appendChild(foreignObject);
    svgXml.setAttribute('height', this.rootStyle.totalHeight);
    foreignObject.setAttribute('width', "100%");
    foreignObject.setAttribute('height', "100%");
    foreignObject.innerHTML = style + this.el.outerHTML; // 插入樣式和內容
    var serializer = new XMLSerializer();
    var source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svgXml);
    var image = new Image();
    var canvas = document.createElement('canvas');  //准备空画布
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    image.width = this.rootStyle.totalWidth; // 圖片寬度
    canvas.width = this.rootStyle.totalWidth; // 畫布寬度
    canvas.height = this.rootStyle.totalHeight; // 畫布高度
    var context = canvas.getContext('2d');  // 取得画布的2d绘图上下文
    context.fillStyle = '#fff'; // #fff设置保存后的PNG 是白色的  
    context.fillRect(0, 0, canvas.width, canvas.height); // 填充白色背景
    image.onload = function () {
      context.drawImage(image, 0, 0);
      var a = document.createElement("a");
      a.download = "name.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
  }
  static image2Base64(img) { // 圖片轉base64
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL;
  }
  getDomStyle (el) { // 獲取渲染後的樣式
    let styleSheetList = window.getComputedStyle(el, null);
    let hasList = ['width','borderWidth','height','padding','paddingTop','paddingLeft','paddingRight','paddingBottom','margin','marginTop','marginLeft','marginRight','marginBottom'];
    let data = {};
    hasList.forEach(key => {
      data[key] = parseInt(styleSheetList[key]);
    })
    data.totalHeight = data.paddingTop + data.paddingBottom + data.height + data.borderWidth * 2;
    data.totalWidth = data.paddingLeft + data.paddingRight + data.width + data.borderWidth * 2;
    return data
  }
}
