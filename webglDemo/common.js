/**
     * 生成着色器对象
     * @param gl webgl上下文
     * @param type 着色器类型
     * @param shaderSource 着色器源码
     *  **/
 function createShader (gl, type ,shaderSource) {
  // 创建着色器对象
  var shader = gl.createShader(type);
  // 设置着色器源码
  gl.shaderSource(shader, shaderSource);
  // 编译着色器
  gl.compileShader(shader);
  // 查看着色器编译状态
  var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (status) return shader;
  // 打印着色器编译日志
  console.log(gl.getShaderInfoLog(shader));
}

/**
* 生成着色器程序
* @param gl webgl上下文
* @param vertexShader 顶点着色器对象
* @param fragmentShader 片元着色器对象
* 
*/
function createProgram(gl, vertexShader, fragmentShader) {
  // 创建着色器程序对象
  var program = gl.createProgram();
  // 为着色器程序添加着色器对象
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // 链接着色器程序到上下文
  gl.linkProgram(program);
  // 着色器程序连接状态
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
      return program;
  }
  // 着色器连接日志
  console.log(gl.getProgramInfoLog(program));
}



    // 生成随机颜色
function randomColor() {
    var r = parseInt(Math.random() * 255);
    var g = parseInt(Math.random() * 255);
    var b = parseInt(Math.random() * 255);
    var a = parseInt(Math.random() * 100);
    return [r, g, b, a];
}