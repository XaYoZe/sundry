const fs = require("fs");
let content = fs.readFileSync("./index.ts", { encoding: "utf-8" });

class ReadText {
  srcText = "";
  index = 0;
  import = [];
  constructor() {
  }
  checkComment (commentType = 0, commentText = '') {
    let cur = this.srcText[this.index];
    let next = this.srcText[this.index + 1];
    if (commentType) {
      if (commentType === 2 && cur === "*" && next === "/") {
        commentText += "*/";
        this.index += 1;
        return commentText;
      }
      if (commentType === 1 && cur === "\r" && next === "\n") {
        this.index += 1;
        return commentText;
      } else if (commentType === 1 && next === "\n") {
        // this.index += 1;
        return commentText;
      }
      this.index++;
      return this.checkComment(commentType, commentText + cur)
    }
    if (cur === "/") {
      if (next === "/") {
        this.index += 2;
        return this.checkComment(1, '//');
      } else if (next === "*") {
        this.index += 2;
        return this.checkComment(2, '/*');
      }
    }
    return false
  }
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
  readString (word = '', strSymbol = '')  {
    let char = this.srcText[this.index];
    if (strSymbol) {
      word += char
      if (char === strSymbol) {
        return word
      }
      this.index++
      return this.readString(word, strSymbol)
    }
    // 字符串类型
    if (char === '\'' || char === '"' ||  char === '`') {
      this.index++
      return this.readString(char,char)
    }
  }
  skipSpace () {

  }
  nextWord () {
    let word = '';
    do {
      this.index++;
      word = this.readWord()
    } while (!word);
    return word;
  }
  readWord (word = '') {
    // 如果是字符串类型
    let string = this.readString();
    if (string) return string;

    let char = this.srcText[this.index];
    let next = this.srcText[this.index + 1];
    let comment = this.checkComment()
    // if (comment) console.log(comment), console.log('---------');
    // 无字符 || 有注释 || 空格回车换行
    if (!char || comment ||  char === " " || char === "\n" || char === "\r") {
      return word || '';
    } else if (['\'', '"', '`', '[',']','{','}','(',')','.','+','-','?','=', ',', ';', ':'].includes(next)) {  // 下一个是字符串标识
      return word + char;
    } else if (['[',']','{','}','(',')','.','+','-','?','=', ',', ';', ':'].includes(char)) {
      return char
    }
    return this.readWord(word + this.srcText[this.index++]);
  }
  checkImport (word) {
    if (word === 'import') {
      let next = this.nextWord();
      let obj = {
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
    while (this.srcText[this.index]) {
      let word = this.readWord();
      // word && console.log(word)
      let importObj = this.checkImport(word);
      
      if (importObj) {
        this.import.push(importObj);
        console.log(importObj);
      }
      this.index++
    }
    return this.import
  }
}

let readText = new ReadText();
let importList = readText.read(content);
fs.writeFileSync('./index.json', JSON.stringify(importList), {encoding: 'utf-8'})