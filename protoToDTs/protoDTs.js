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
    const protoParse = this.protoParseCache[filePath] = {
      ast: null,
      dTsStr: '',
      packageName: '',
      filePath: filePath
    };
    const ast = parse(text);
    let filePathParse = path.parse(filePath);
    let dTsStrArr = [];
    let packageName = '';
    let importList = [];
    let service = '';
    ast.ast.statements.forEach(item => {
      if (item.type === 'package') {
        packageName = item.fullIdent.identOrDots[0].text
      } else if (item.type === 'import') {
        if (item.weakOrPublic) {
          // item.weakOrPublic.text === 'weak' && importList.push(`import * as ${item.strLit.tokens[0].text} from '${item.strLit.tokens[1].text}';`)
          // item.weakOrPublic.text === 'public' && importList.push(`export * from ${item.strLit.tokens[0].text};`)
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
          let importPackage = this.read(fs.readFileSync(importPath, {encoding: 'utf-8'}), importPath);
          if (packageName !== importPackage.packageName) {
            // importList.push(`import {${importPackage.packageName}} from "./${path.relative(filePathParse.dir, importPath).replace(/\\/g, '/')}";`)
          }
        }

      }
      } else if (item.type === 'service') {
        dTsStrArr = dTsStrArr.concat(this.createService(item, 1))
      } else if (item.type === 'message') {
        dTsStrArr = dTsStrArr.concat(this.createMessage(item, 1))
      } else if (item.type === 'enum') {
        dTsStrArr = dTsStrArr.concat(this.createEnum(item, 1))
      }
    })
    protoParse.ast = ast;
    protoParse.dTsStr = [
      ...importList,
      `declare namespace ${packageName} {`, 
        ...dTsStrArr,
      `}`,
    ].join('\n');
    protoParse.packageName = packageName;
    this.protoParseCache[filePath] = protoParse;
    return protoParse
  }
  joinText (arr = []) {
    return arr.map(item => item.text).join('')
  }
  /** @param {import('./protoAst/ast/index').Message} msgItem  */
  joinComment ({leadingDetachedComments, leadingComments, trailingComments}) {
    let commentTextArr = [];
    let arr = [];
    if (trailingComments.length) {
      arr = trailingComments
    } else if (leadingComments.length) {
      arr = leadingComments
    } else if (leadingDetachedComments.length) {
      let multilineComment = leadingDetachedComments.slice(-1)[0]?.comments?.slice(-1)[0];
      if (multilineComment.type === 'multiline-comment') {
        arr = [{comments: [multilineComment]}]
      }
    }

    arr.forEach(commentGroup => {
      commentGroup.comments.forEach(comment => {
        if (comment.type === 'singleline-comment') {
          let commentText = comment.text.replace(/^\/\/|\r?\n$/g, '').trim();
          commentText && commentTextArr.push(`/** ${ commentText } */`)
        } else if (comment.type === 'multiline-comment') {
          commentTextArr.push(...comment.text.split(/\r?\n/g))
        }
      })
    })
    return commentTextArr
  }
  padStartTab (arr, tabIndex) {
    return arr.map((item, i) => {
      return ''.padStart(tabIndex * this.tabSize) + item
    });
  }
  /** @param {import('./protoAst/ast/index').Message} mssageItem  */
  createMessage (mssageItem, tabIndex = 0) {
    let insertMssage = [];
    let insertEnum = [];
    return this.padStartTab([
      ...this.joinComment(mssageItem),
      `export interface ${mssageItem.messageName.text} {`,
      ...this.padStartTab(mssageItem.messageBody.statements.map(messageBody => {
        if (messageBody.type === 'message') {
          insertMssage.push(messageBody);
        } else if (messageBody.type === 'enum') {
          insertEnum.push(messageBody);
        } else {
          try {
            let keyStr = '';
            let valueStr = '';
            if (messageBody.type === 'map-field') {
              let keyType = this.joinText(messageBody.keyType.identOrDots);
              let valueType = this.joinText(messageBody.valueType.identOrDots);
              keyStr = `${messageBody.mapName.text}`;
              valueStr = `Record<${ProtoAstToDTs.FeildType[keyType] || keyType}, ${ProtoAstToDTs.FeildType[valueType] || valueType}>`

              return [
                this.joinComment(messageBody),
                `${keyStr}: ${valueStr}`
              ]
            } else if (messageBody.type === 'field') {
              let isRequired = '?';
              keyStr = `${messageBody.fieldName.text}`;
              valueStr = this.joinText(messageBody.fieldType.identOrDots);
              if (messageBody.fieldLabel?.type === 'keyword') {
                if (messageBody.fieldLabel.text === 'required') { // 必填
                  isRequired = ''
                } else if (messageBody.fieldLabel.text === 'repeated') { // 数组
                  valueStr = `Array<${ProtoAstToDTs.FeildType[valueStr] ||valueStr}>`;
                } else {
    
                }
              }
              return [
                this.joinComment(messageBody),
                `${keyStr}${ isRequired }: ${ProtoAstToDTs.FeildType[valueStr] || valueStr}`
              ]
            } else {
              console.log('跳过', messageBody)
            }
          } catch(err) {
            err
          }
        }
      }).flat(9).filter(item => !!item), 1),
      `}\n`,
      ...insertMssage.map(msgItem => this.createMessage(msgItem)).flat(9),
      ...insertEnum.map(enumItem => this.createEnum(enumItem)).flat(9),
    ], tabIndex);
  }
  /** @param {import('./protoAst/ast/index').Enum} enumItem  */
  createEnum (enumItem, tabIndex = 0) {
    return this.padStartTab([
      ...this.joinComment(enumItem),
      `export enum ${enumItem.enumName.text} {`,
      ...this.padStartTab(enumItem.enumBody.statements.map(enumBody => {
        if (enumBody.type === 'enum-field') {
          return [
            this.joinComment(enumBody),
            `${enumBody.fieldName.text} = ${enumBody.fieldNumber.value.text},`
          ]
        } else {
          enumBody
        }
      }).flat(9).filter(item => !!item), 1),
      `}\n`
    ], tabIndex);
  }
  /** @param {import('./protoAst/ast/index').Service} serviceItem  */
  createService (serviceItem, tabIndex = 0) {
    return this.padStartTab([
      `export namespace service {`,
      ...this.padStartTab(serviceItem.serviceBody.statements.map(serviceBody => {
        if (serviceBody.type === 'rpc') {
          return `function ${serviceBody.rpcName.text} (data: ${this.joinText(serviceBody.reqType.messageType.identOrDots)}): ${this.joinText(serviceBody.resType.messageType.identOrDots)};`
        } else {
          serviceBody
        }
      }).filter(item => !!item), 1),
      `}\n`,
    ], tabIndex)
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
    textData.filePath + '.d.ts',
    textData.dTsStr,
    {encoding: 'utf-8', 'flag': 'w+'});
  // console.log(text)
})



