function detectIE() {
    var userAgent = window.navigator.userAgent;
    var b = userAgent.indexOf("MSIE ");
    if (b > 0) {
        return parseInt(userAgent.substring(b + 5, userAgent.indexOf(".", b)), 10)
    }
    var a = userAgent.indexOf("Trident/");
    if (a > 0) {
        var e = userAgent.indexOf("rv:");
        return parseInt(userAgent.substring(e + 3, userAgent.indexOf(".", e)), 10)
    }
    var d = userAgent.indexOf("Edge/");
    if (d > 0) {
        return parseInt(userAgent.substring(d + 5, userAgent.indexOf(".", d)), 10)
    }
    return false
}
var ver = detectIE();
if (ver && ver < 12) {
    var node = document.createElement("div");
    node.id = "ie_alert";
    node.innerHTML = 'Internet Explorer doesn\'t support picdiet, you can use <a target="_blank" rel="nofollow" href="https://www.google.com/chrome/index.html">Chrome</a> or <a target="_blank" rel="nofollow" href="https://www.mozilla.org/en-US/firefox/">Firefox</a> ';
    document.body.appendChild(node)
};

function getElementById(d) {
    return document.getElementById(d);
}
var s = getElementById('compare').getBoundingClientRect();
getElementById('compare').addEventListener('mousemove', function(e) {
    getElementById('img_compressed').style.width = (e.pageX - s.left) + 'px';
    getElementById('separator').style.marginLeft = (e.pageX - s.left) + 'px';
});
getElementById('q_value').addEventListener('input', function() {
    getElementById('quality').innerHTML = this.value + '%';
})
var [readAsText,readAsArrayBuffer,readAsDataURL] = ['readAsText', 'readAsArrayBuffer', 'readAsDataURL'].map(
  (read)=>{
    return (file)=>new Promise(resolve=>{
        var reader = new FileReader();
        reader[read](file);
        reader.onload = e=>{
            resolve(e.target.result)
        }
    }
    )
  }
);
function getImageData(file) {
    return readAsArrayBuffer(file).then(buffer=>new Uint8Array(buffer));
}
function getDataUrl(file) {
    return readAsDataURL(file).then(function(url) {
        return url;
    })
}
function bytesToSize(a, b) {
    if (0 == a)
        return "0 Bytes";
    var c = 1024
      , d = b || 2
      , e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
      , f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f]
}
var len = 0;
var dataUrl;
var zip = new JSZip();
var imgfolder = zip.folder("picdiet");
var i = 0;
var blob;
var fname;
getElementById('up_txt').addEventListener('click', function() {
    location.reload()
})
input.onchange = e=>{
    len = input.files.length;
    getElementById('single_spinner').classList.add('show');
    input.style.display = 'none'
    if (typeof ver !== 'undefined' && ver >= 12) {
        getElementById('spinner').style.display = 'none';
        getElementById('pgs_percent').innerHTML = 'compressing'
    }
    if (len == 1) {
        var picReader = new FileReader();
        picReader.addEventListener("load", function(event) {
            dataUrl = event.target.result;
        });
        picReader.readAsDataURL(input.files[0]);
        setTimeout(function() {
            var file = input.files[0];
            getImageData(file).then(data=>{
                var now = performance.now();
                var result = cjpeg(data, {
                    quality: getElementById('q_value').value
                }, console.info);
                blob = new Blob([result.data],{
                    type: 'image/jpeg'
                });
                getElementById('after').src = URL.createObjectURL(blob);
                fname = file.name;
                getElementById('before').src = dataUrl;
                getElementById('before').onload = function() {
                    var wd = Math.min(this.naturalWidth, 970);
                    var ht = this.naturalHeight / this.naturalWidth * wd;
                    getElementById('compare').style.width = wd + 'px';
                    getElementById('compare').style.height = ht + 'px';
                    getElementById('separator').style.height = ht + 'px';
                    getElementById('img_compressed').style.width = wd / 2 + 'px';
                    getElementById('separator').style.marginLeft = wd / 2 + 'px';
                    getElementById('o_title').style.marginRight = (30 - wd / 2) + 'px';
                    s = getElementById('compare').getBoundingClientRect();
                }
                getElementById('single_spinner').classList.remove('show');
                var pre_size = bytesToSize(file.size);
                var after_size = bytesToSize(blob.size);
                getElementById('p_title').innerHTML = 'Picdiet: ' + after_size;
                getElementById('pre_filesize').innerHTML = pre_size;
                getElementById('bar_pre').innerHTML = pre_size;
                getElementById('o_title').innerHTML = 'Original: ' + pre_size;
                getElementById('aft_filesize').innerHTML = after_size;
                getElementById('bar_after').innerHTML = after_size;
                getElementById('duration').innerHTML = (performance.now() - now).toFixed() + ' ms';
                var rd = ((1 - blob.size / file.size) * 100).toFixed();
                getElementById('reduction_percent').innerHTML = rd + '%';
                getElementById('bar_reduction').innerHTML = rd + '%';
                getElementById('bar_blue').style.width = 450 * (1 - rd / 100) + 'px';
                getElementById('compress_info').classList.add('show');
                getElementById('up_txt').innerHTML = getElementById('recompress').value;
                getElementById('dld').style.width = '120px';
                getElementById('dld_original').style.display = 'none';
            }
            )
        }, 100)
    } else {
        setTimeout(function() {
            compress_loop();
        }, 100)
    }
}
getElementById('dld').addEventListener('click', function() {
    if (len > 1) {
        zip.generateAsync({
            type: "blob"
        }).then(function(content) {
            saveAs(content, "picdiet.zip");
        });
    } else {
        saveAs(blob, fname)
    }
})
var ini_filesize = 0;
var ini_opt_filesize = 0;
var starttime;
function compress_loop() {
    if (i < len) {
        if (i == 0) {
            starttime = new Date().getTime();
            getElementById('q_value').disabled = true;
            getElementById('pgs_percent').innerHTML = '0%';
        }
        var file = input.files[i];
        getImageData(file).then(data=>{
            var result = cjpeg(data, {
                quality: getElementById('q_value').value
            });
            var blob = new Blob([result.data],{
                type: 'image/jpeg'
            });
            console.log(file.name, result);
            imgfolder.file(file.name, blob);
            i++;
            ini_filesize = ini_filesize + file.size;
            ini_opt_filesize = ini_opt_filesize + blob.size;
            getElementById('pgs_percent').innerHTML = Math.ceil(i * 100 / len) + '%'
            compress_loop();
        }
        );
    } else {
        getElementById('pre_filesize').innerHTML = bytesToSize(ini_filesize);
        getElementById('aft_filesize').innerHTML = bytesToSize(ini_opt_filesize);
        getElementById('duration').innerHTML = (new Date().getTime() - starttime).toFixed() + ' ms';
        var rd = ((1 - ini_opt_filesize / ini_filesize) * 100).toFixed();
        getElementById('reduction_percent').innerHTML = rd + '%';
        getElementById('compress_info').classList.add('show')
        getElementById('single_spinner').classList.remove('show');
        getElementById('up_txt').innerHTML = getElementById('recompress').value;
        getElementById('pgs_percent').innerHTML = '';
        getElementById('q_value').disabled = false;
        getElementById('dld').style.width = '120px';
        getElementById('dld_original').style.display = 'none';
    }
}
