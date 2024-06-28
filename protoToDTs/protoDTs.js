const path = require('path'),
  fs = require('fs'),
  { parse, Statement }  = require('./protoAst/parser/proto')


// 查找文件
function searchFile(dirPath, searchValue, storeArr = [], callback) {
  const fileList = fs.readdirSync(dirPath, { withFileTypes: true })
  fileList.forEach((dirent) => {
    const filePath = path.join(dirPath, dirent.name)
    if (dirent.isFile()) {
      if (!searchValue || (searchValue && searchValue.test(filePath))) {
        callback && callback(filePath)
        storeArr.push(filePath)
      }
    } else {
      searchFile(filePath, searchValue, storeArr, callback)
    }
  })
  return storeArr
}

const protoList = [];
const protoPath = path.resolve('./proto');
searchFile(protoPath, /.proto$/, protoList);
class ProtoAstToDTs {
  constructor (protoPath) {
    this.tabSize = 2;
    this.protoPath = protoPath;
    this.protoParseCache = {};
  }
  read (text, filePath) {
    if (this.protoParseCache[filePath]) {
      return this.protoParseCache[filePath]
    }
    const protoParse = this.protoParseCache[filePath] = {ast: null, dTsStr: '', packageName: ''};
    const ast = parse(text);
    let dTsStr = '';
    let packageName = '';
    ast.ast.statements.forEach(item => {
      if (item.type === 'package') {
        packageName = item.fullIdent.identOrDots[0].text
      } else if (item.type === 'import') {
        
      } else if (item.type === 'service') {
        dTsStr += this.createService(item)
      } else if (item.type === 'message') {
        dTsStr += this.createMessage(item)
      } else if (item.type === 'enum') {
        dTsStr += this.createEnum(item)
      }
    })
    protoParse.ast = ast;
    protoParse.dTsStr = dTsStr;
    protoParse.packageName = packageName;
    return protoParse
  }
  joinText (arr = []) {
    return arr.map(item => item.text).join('')
  }
  padStartTab (arr, tabIndex) {
    return arr.map((item, i) => {
      return ''.padStart(tabIndex * this.tabSize) + item + (i === arr.length - 1 ? '' : '\n')
    }).join('');
  }
  /** @param {import('./protoAst/ast/index').Message} mssageItem  */
  createMessage (mssageItem, tabIndex = 0) {
    return this.padStartTab([
      `export interface ${mssageItem.messageName.text} {`,
      this.padStartTab(mssageItem.messageBody.statements.map(messageBody => {
        if (messageBody.type === 'message') {
          return this.createMessage(messageBody, tabIndex + 1)
        } else if (messageBody.type === 'enum') {
          return this.createEnum(messageBody, tabIndex + 1)
        } else {
          try {
          let keyStr = '';
          let valueStr = '';
          let isRequired = '?';
          if (messageBody.type === 'map-field') {
            keyStr = `${messageBody.mapName.text}`;
            valueStr = `Record<${this.joinText(messageBody.keyType.identOrDots)}, ${this.joinText(messageBody.valueType.identOrDots)}>`
          } else if (messageBody.type === 'field') {
            keyStr = `${messageBody.fieldName.text}`;
            valueStr = this.joinText(messageBody.fieldType.identOrDots);
            if (messageBody.fieldLabel?.type === 'keyword') {
              if (messageBody.fieldLabel.text === 'required') {
                isRequired = ''
              } else if (messageBody.fieldLabel.text === 'repeated') {
                valueStr = `Array<${valueStr}>`;
              } else {
  
              }
            }
          } else {
            
          }
          return `${keyStr}${ isRequired }: ${valueStr}`
          } catch(err) {
            err
          }
        }
      }), tabIndex + 1),
      `}\n`
    ], tabIndex);
  }
  /** @param {import('./protoAst/ast/index').Enum} enumItem  */
  createEnum (enumItem, tabIndex = 0) {
    return this.padStartTab([
      `export enum ${enumItem.enumName.text} {`,
      this.padStartTab(enumItem.enumBody.statements.map(enumBody => {
        if (enumBody.type === 'enum-field') {
          return `  ${enumBody.fieldName.text} = ${enumBody.fieldNumber.value.text},`
        } else {
          enumBody
        }
      }), tabIndex + 1),
      `}\n`
    ], tabIndex);
  }
  createService (item) {
    return
  }
}
const pbDTs = new ProtoAstToDTs(protoPath);
protoList.forEach((filePath) => {
  const text = fs.readFileSync(filePath, {encoding: 'utf-8'})
  if (!fs.existsSync(protoPath)) {
    fs.mkdirSync(protoPath)
  }
  const protoDTsFilePath = path.join(protoPath, `${filePath.replace(/\\/g, '/').split('/').slice(-1)[0]}.d.ts`);
  const textData = pbDTs.read(text, filePath);
  fs.writeFileSync(
    protoDTsFilePath,
    textData.dTsStr,
    {encoding: 'utf-8', 'flag': 'w+'});
  // console.log(text)
})



