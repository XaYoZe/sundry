const fs = require("fs");
const path = require('path');
let content = fs.readFileSync(path.resolve("./index.ts"), { encoding: "utf-8" });
var readStatus = {

}
class ReadText {
  row = 1;
  col = 1;
  srcText = "";
  index = 0;
  import = [];
  status = 0; // 0 正常, 1 備註
  constructor() {
  }
  checkComment (index, commentType = 0, commentText = '') {
    let cur = this.srcText[index];
    let next = this.srcText[index + 1];
    
      if (commentType) {
      if ( next === "\n") { this.row++; };
      if (commentType === 2 && cur === "*" && next === "/") {
        commentText += "*/";
        index += 2;
        return {start: this.index, end: index, size:index - this.index, text: commentText, type: 'Comment'};
      }
      if (!next || (commentType === 1 && cur === "\r" && next === "\n")) {
        index += 2;
        return {start: this.index, end: index, size:index - this.index, text: commentText, type: 'Comment'};
      } else if (commentType === 1 && next === "\n") {
        index += 1;
        return {start: this.index, end: index, size:index - this.index, text: commentText, type: 'Comment'};
      }
      return this.checkComment(index + 1, commentType, commentText + cur)
    }
    if (cur === "/") {
      // console.log(this.srcText.slice(index, index + 21))
      if (next === "/") {
        index += 2;
        return this.checkComment(index, 1, '//');
      } else if (next === "*") {
        index += 2;
        return this.checkComment(index, 2, '/*');
      } else {
        return false; 
      }
    }
    return false
  }
  checkRegExp (index, text = '', isReg = false) {
    let cur = this.srcText[index];
    let next = this.srcText[index + 1];
    if (isReg) {
      text += cur;
      // 斜杠結尾 非轉義斜杠
      if (cur !== '/' || (cur === '/' && this.srcText[index - 1] === '\\')) {
        return this.checkRegExp(index + 1, text, true)
      }
      if (['i', 'g', 'm', 's'].includes(next)) {
        let nextWord = this.readWord(index + 1);
        if (!/[^igms]/.test(nextWord.text)) {
          text += nextWord.text;
          index += nextWord.size;
        }
      }
      return {start: this.index, end: index, size:index - this.index + 1, text, type: 'RegExp'}
    }
    if (cur === "/") {
      // 排除注釋
      if (next !== "/" && next !== "*") {
        // 排除除法計算a/b igm/ 標籤</
        let prevWord = this.readWord(index -1, -1, true).text;
        if (this.isVariable(prevWord) || prevWord === ')'  || prevWord === '<') {
          return 
        }
        return this.checkRegExp(index + 1, '/', true);
      }
    }
  }
  // 判斷是否是變量名
  isVariable (text) {
    return /^[_$A-Za-z][_$0-9A-Za-z]*$/.test(text)
  }
  isString (text, index = 0, strSymbol = '') {
    let char = text[index];
    let next = text[index + 1];
    if (strSymbol) {
      if (char === strSymbol) {
        if (!next) {
          return true;
        }
        return false
      }
      return this.isString(text, index + 1, strSymbol)
    }
    if (char === '\'' || char === '"' ||  char === '`') {
      return this.isString(text, index + 1, char)
    }
    return false;
  }
  readString (index, text = '', strSymbol = '', trans = false)  {
    let char = this.srcText[index];
    if (strSymbol) {
      index++ 
      text += char
      if (char === strSymbol && !trans) {
        return {start: this.index, end: index, size:index - this.index, text, type: 'String'}
      }
      return this.readString(index, text, strSymbol, !trans && char == '\\')
    }
    // 字符串类型
    if (char === '\'' || char === '"' ||  char === '`') {
      index++
      return this.readString(index, char,char)
    }
  }
  skipSpace () {

  }
  readWord (index, step = 1 , skipSpace = false, word = '') {
    // 如果是字符串类型
    // let comment = this.checkComment();
    // let string = this.readString();
    // if (string) return string;
    let char = this.srcText[index];
    let next = this.srcText[index + step];
    // 跳過空白字符
    if (skipSpace && char === " " || char === "\n" || char === "\r") {
      return this.readWord(index + step, step, false);
    }
    // if (comment) console.log(comment), console.log('---------');
    // 无字符 || 有注释 || 空格回车换行
    if (!char || char === " " || char === "\n" || char === "\r" || ['/','<','>','[',']','{','}','(',')','.','+','-','?','=', ',', ';', ':'].includes(char)) {
      return {start: this.index, end: index, size: index - this.index + step, text: char };
    } else if ([undefined, ' ', '\n', '\r', '\'', '"', '`', '/','<','>','[',']','{','}','(',')','.','+','-','?','=', ',', ';', ':'].includes(next)) {  // 下一个是字符串标识
      return {start: this.index, end: index, size: index - this.index + step, text: word + char || ''};
    }
    return this.readWord(index + step, step, false, word + char);
  }
  checkImport (word) {
    if (word === 'import' && (!this.srcText[this.index - 1] || [' ', '\n', '\r'].includes(this.srcText[this.index - 1]))) {
      let next = this.nextWord();
      let obj = {
        row: this.row,
        moduleName: '',
        default: '',
        alias: '',
        export: []}
      if (this.isString(next)) { //   import '/modules/my-module.js';
        obj.moduleName = next.slice(1, next.length - 1);
      } else if (next === '(') { //   import('/modules/my-module.js')
        next = this.nextWord()
        obj.moduleName = next.slice(1, next.length - 1);
      } else {
        do {
          if (next === '*') { // * as myModule
            if (this.nextWord() === 'as') {
              obj.alias = this.nextWord();
            }
            next = this.nextWord();
          } else if (next === '{'){ // {foo, bar}
            do {
              next = this.nextWord() 
              if (next === ',') {
                next = this.nextWord();
              }
              if (next === '}') { 
                break
              }
              let exportObj = {name: next}
              next = this.nextWord();
              if (next == 'as') { // {ExportName as name }
                exportObj.alias = this.nextWord()
              }
              obj.export.push(exportObj)
            } while (next !== '}');
            next = this.nextWord()
          } else if (this.isVariable(next)) { //  import myDefault from '/modules/module.js';
            obj.default = next;
            next = this.nextWord()
            if (next === ',') next = this.nextWord()
          } else {
            return
          }
        } while (next !== 'from')
        next = this.nextWord()
        obj.moduleName = next.slice(1, next.length - 1)
      }
      return obj;
    }
  }
  read (srcText) {
    this.srcText = srcText;
    this.index = 0;
    // while (this.srcText[this.index]) {
    //   let word = this.readWord();
    //   word && console.log(word)
    //   let importObj = this.checkImport(word);
      
    //   if (importObj) {
    //     this.import.push(importObj);
    //     console.log(importObj);
    //   }
    //   this.index++
    // }
    // return this.import
    this.readChar();
  }
  skip (num = 1) {
    this.index += num;
  }
  readChar (str) {
    let char = this.srcText[this.index];
    let skipNum = 1;
    if (char) {
      // let word = this.readWord(this.index)
      // skipNum = word.size;
      let comment = this.checkComment(this.index)
      if (comment) {
        skipNum = comment.size;
        this.skip(skipNum)
        this.readChar();
        console.log(comment);
        return
      }
      let regExp = this.checkRegExp(this.index)
      if (regExp) {
        skipNum = regExp.size;
        console.log(regExp);
        this.skip(skipNum)
        this.readChar();
        return
      }
      let readString = this.readString(this.index);
      if (readString) {
        skipNum = readString.size;
        console.log(readString);
        this.skip(skipNum)
        this.readChar();
        return
      }
      // let coment = this.checkComment(this.index,);
      // if (/[^\s]/.test(word.text)) {
        //   console.log(this.row, this.col, text);
      // } else {
      //   console.log(this.row, this.col, word.text);
      // }
      // if (word.text === '\n') {
      //   this.row++
      //   this.col = 0;
      //   // console.log(this.row)
      // } else {
      //   this.col += skipNum;
      // }
      // this.prevWord = this.word;
      this.skip(skipNum)
      this.readChar();
    }
  }
}

let readText = new ReadText();
let importList = readText.read(content);
// fs.writeFileSync('./index.json', JSON.stringify(importList), {encoding: 'utf-8'})