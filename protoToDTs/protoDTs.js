const path = require('path'),
  fs = require('fs'),
  // 使用ast库 https://github.com/riiid/pbkit?tab=readme-ov-file
  // ast工具 https://astexplorer.net/
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
  static FeildType = {
    int32: 'number',
    int64: 'number',
    uint32: 'number',
    uint64: 'number',
    sint32: 'number',
    sint64: 'number',
    fixed32: 'number',
    fixed64: 'number',
    sfixed32: 'number',
    sfixed64: 'number',
    string: 'string',
    bytes: 'ArrayBuffer',
    bool: 'boolean',
    double: 'number',
    float: 'number',
  }
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
    let filePathParse = path.parse(filePath);
    let dTsStr = '';
    let packageName = '';
    let importList = [];
    let service = '';
    ast.ast.statements.forEach(item => {
      if (item.type === 'package') {
        packageName = item.fullIdent.identOrDots[0].text
      } else if (item.type === 'import') {
        if (item.weakOrPublic) {
          // item.weakOrPublic.text === 'weak' && importList.push(`import * as ${item.strLit.tokens[0].text} from '${item.strLit.tokens[1].text}';`)
          item.weakOrPublic.text === 'public' && importList.push(`export * from ${item.strLit.tokens[0].text};`)
      } else {
        let checkPath =  '';
        let relativePath = '';
        let importPath = '';
        do {
          relativePath += '../';
          checkPath = path.join(filePathParse.dir, relativePath);
          importPath = path.join(checkPath, JSON.parse(item.strLit.tokens[0].text))
          if (fs.existsSync(importPath)) {
            break
          }
          importPath = '';
        } while (checkPath !== filePathParse.root);
        if (importPath) {
          let importPackage = this.read(fs.readFileSync(importPath, {encoding: 'utf-8'}), importPath)
          importList.push(`import {${importPackage.packageName}} from "./${path.relative(filePathParse.dir, importPath)}";`)
        }

      }
      } else if (item.type === 'service') {
        dTsStr += this.createService(item)
      } else if (item.type === 'message') {
        dTsStr += this.createMessage(item)
      } else if (item.type === 'enum') {
        dTsStr += this.createEnum(item)
      }
    })
    protoParse.ast = ast;
    protoParse.dTsStr = [
      ...importList,
      `export namespace ${packageName} {`, dTsStr, `}`,
      service
    ].join('\n');
    protoParse.packageName = packageName;
    this.protoParseCache[filePath] = protoParse;
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
    let insertMssage = [];
    let insertEnum = [];
    return this.padStartTab([
      `export interface ${mssageItem.messageName.text} {`,
      this.padStartTab(mssageItem.messageBody.statements.map(messageBody => {
        if (messageBody.type === 'message') {
          insertMssage.push(messageBody);
          // return this.createMessage(messageBody, tabIndex + 1)
        } else if (messageBody.type === 'enum') {
          insertEnum.push(messageBody);
          // return this.createEnum(messageBody, tabIndex + 1)
        } else {
          try {
            let keyStr = '';
            let valueStr = '';
            if (messageBody.type === 'map-field') {
              let keyType = this.joinText(messageBody.keyType.identOrDots);
              let valueType = this.joinText(messageBody.valueType.identOrDots);
              keyStr = `${messageBody.mapName.text}`;
              valueStr = `Record<${ProtoAstToDTs.FeildType[keyType] || keyType}, ${ProtoAstToDTs.FeildType[valueType] || valueType}>`
              return `${keyStr}: ${valueStr}`
            } else if (messageBody.type === 'field') {
              let isRequired = '?';
              keyStr = `${messageBody.fieldName.text}`;
              valueStr = this.joinText(messageBody.fieldType.identOrDots);
              if (messageBody.fieldLabel?.type === 'keyword') {
                if (messageBody.fieldLabel.text === 'required') {
                  isRequired = ''
                } else if (messageBody.fieldLabel.text === 'repeated') {
                  valueStr = `Array<${ProtoAstToDTs.FeildType[valueStr] ||valueStr}>`;
                } else {
    
                }
              }
              return `${keyStr}${ isRequired }: ${ProtoAstToDTs.FeildType[valueStr] || valueStr}`
            } else {
              keyStr
              
            }
          } catch(err) {
            err
          }
        }
      }).filter(item => !!item), tabIndex + 1),
      `}\n`,
      ...insertMssage.map(msgItem => this.createMessage(msgItem, tabIndex)),
      ...insertEnum.map(enumItem => this.createEnum(enumItem, tabIndex)),
    ], tabIndex);
  }
  /** @param {import('./protoAst/ast/index').Enum} enumItem  */
  createEnum (enumItem, tabIndex = 0) {
    return this.padStartTab([
      `export enum ${enumItem.enumName.text} {`,
      this.padStartTab(enumItem.enumBody.statements.map(enumBody => {
        if (enumBody.type === 'enum-field') {
          return `${enumBody.fieldName.text} = ${enumBody.fieldNumber.value.text},`
        } else {
          enumBody
        }
      }).filter(item => !!item), 1),
      `}\n`
    ], tabIndex);
  }
  /** @param {import('./protoAst/ast/index').Service} serviceItem  */
  createService (serviceItem) {
    return this.padStartTab([
      // `export type ${serviceItem.serviceName.text} = {`,
      this.padStartTab(serviceItem.serviceBody.statements.map(serviceBody => {
        if (serviceBody.type === 'rpc') {
          return `function ${serviceBody.rpcName.text} (data: ${this.joinText(serviceBody.reqType.messageType.identOrDots)}): ${this.joinText(serviceBody.resType.messageType.identOrDots)};`
        } else {
          serviceBody
        }
      }).filter(item => !!item), 1),
      // `}\n`,
    ])
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



