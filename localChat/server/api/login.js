
import url from 'node:url';
import fs from 'node:fs/promises'
import * as jose from 'jose';
import path from 'node:path';

const secret = new TextEncoder().encode('0f78b5324d862abfa4b590ae96e042105183cf6392f14a44adfd78eebca8ef25')

let userData = null;
export async function getUserData (id) {
  if (!userData) {
    try {
      let fileData = await fs.readFile(path.resolve('./server/data/user.json'), 'utf8');
      if (fileData) {
        userData = JSON.parse(fileData);
      }
    } catch (err) {
      userData = {};
      console.log(err);
    }
  }
  return userData[id]

}



/**
 * 接口处理
 * @this { import('../../server.js').default }
 * @param  { import('http').IncomingMessage } req http请求信息
 * @param { import('http').ServerResponse } res http返回信息
 */
export default async function (req, res) {
  console.log(this.store.subList);
  let reqUrl = url.parse(req.url, true);
  let { id, psw, token } = reqUrl.query;
  let data = await getUserData(id);
  console.log(data.psw, psw)
  if (data && psw === data.psw) {
    let token = await getToken(id, id)
    res.end(JSON.stringify({token, ...data}));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({code: 404, msg: '账号或密码错误'}));
  }
  // // 检查账号密码正确
  // if (token) {
  //   try {
  //     let verifyResult = await verifyToken(token)
  //     res.end(JSON.stringify({verify: true, info: verifyResult}));
  //   } catch (err) {
  //     res.end(JSON.stringify({verify: false}));
  //   }
  // } else if (id) {
  // } else {
  //   res.end(JSON.stringify({code: 404, msg: '账号或密码错误'}));
  // }
};

// 生成token
export async function getToken (name, id) {
  const iat = Date.now()
  const jwt = await new jose.SignJWT({uid: id})
  .setIssuer('localChat') // 设置签发者
  .setAudience(id) // 设置接收者
  .setProtectedHeader({alg: 'HS256', typ: 'JWT'}) // 设置header
  .setIssuedAt() // 设置签发时间
  .setExpirationTime('1h') // 设置有效期
  .sign(secret) // 签发
  return jwt
}

// 校验token
function verifyToken(token) {
  return jose.jwtVerify(token, secret)
}