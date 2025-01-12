// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import actPbJson from '@pb/index.min.json';
import { Type , Root, Message } from 'protobufjs';

function deepMerge<T extends T1, T1>(target: T, source: T1):T&T1 {
  for (const key in source) {
      if (source[key] instanceof Object) {
          if (!target[key as string]) Object.assign(target, { [key]: {} });
          deepMerge(target[key as string], source[key as string]);
      } else {
          Object.assign(target, { [key]: source[key] });
      }
  }
  return target;
}
// 请求配置项
export interface RequeryParams extends Record<string, any> {
  /** 接口方法名 */
  funcName?: string,
  /** key */
  token?: string,
  /** 请求数据proto名称 */
  reqDesction?: string,
  /** 返回数据proto名称 */
  resDesction?: string,
  /** 服务名 */
  serverName?: string,
  /** 接口数据 */
  data?: object,
}

/**
 * 發送前攔截回調
 * @param {RequeryParams} params 將發送的數據
 * @returns { RequeryParams } 處理完的數據支持promise或直接返回數據
 */
export type BeforeSendCallback<Req> = (
  params: {
    [T in keyof RequeryParams]?: T extends 'data' ? Req : RequeryParams[T]
  }
) => (Promise<typeof params> | typeof params)
/** 接口方法
 * @param {object} data 接口數據
 * @param {RequeryParams} options 配置项
 * @param {Function} beforeSendEvent 入参
 * @returns { Promise<Object> } Promise<Object>
 */
export type ApiCallFun <Req extends object, Res extends object> = (
  data?: {
    [K in keyof Req]: Req[K]
  },
  options?: RequeryParams,
  beforeSendEvent?: BeforeSendCallback<Req>
) => Promise<Res>

export interface ApiProxy {
  [key: string]: any,
}

export interface ApiCall extends ApiProxy {
  // pbCaches: object,
  // /** 全局請求前數據處理 */
  beforeSend: (cb: (obj: RequeryParams) => RequeryParams|Promise<RequeryParams>) => void,
  // pbRoot: null,
  // 獲取方法
  // getPbMethod: null,
  // // 初始化pb對象
  // initRoot: (any) => void,
  // apiPbFunc: (any) => any,
  // encode: (desction: any, data: any) => any,
  // decode: (desction: any, data: any) => any,
}

/* 接口调用, sPb已兼容
 * 使用: 
 * import API from '@apiCall' // 引入该文件
 * API.GetActivity(data?, option?) // 使用GetActivity接口  data: 数据, * option: 配置项RequeryParams
 */

const sourceApiCall = {
  // 协议缓存
  pbCaches: {},
  pbRoot: null,
  // 獲取方法
  getPbMethod: null,
  beforeSendEvent: undefined,
  // 初始化pb對象
  initRoot: function (json) {
    this.pbRoot = Root.fromJSON(json).resolveAll();
    // 重置獲取方法
    this.getPbMethod = (() => {
      const serviceList = this.pbRoot.nestedArray.reduce((arr, pg) => arr.concat(pg.nestedArray.filter(method => method.methods)), [])
      return (funcName, serviceName) => {
        if (serviceName) {
          return this.pbRoot.lookupService(serviceName).get(funcName)
        }
        let method = null;
        for (let i = 0; i < serviceList.length; i++) {
          if (!serviceName) {
            method = serviceList[i].get(funcName);
            if (method) return method;
          }
        }
        return method
      }
    })()
  },
  // 調用方法pb處理
  apiPbFunc: function (funcName:string|symbol, serverName:string|undefined = '') {
    const cacheName = `${serverName}${String(funcName)}`;
    if (this.pbCaches[cacheName]) return this.pbCaches[cacheName];
    const serviceName = serverName.split('.').slice(-1)[0]
    const lookup = this.getPbMethod(funcName, serviceName)
    if (!lookup) throw(`錯誤: 未在protobuf的json中找到${String(funcName)}的方法`);
    if (!serverName) {
      const serviceName = lookup.fullName.split('.').slice(-2, -1)[0];
      const pgName = serviceName.replace('ExtObj', '')
    }
    const cacheData = {
      lookup,
      serverName,
      requestType: lookup.requestType,
      responseType: lookup.responseType,
      decode: (data) => {
        return this.decode(lookup.resolvedResponseType, data)
      },
      encode: (data) => {
        return this.encode(lookup.resolvedRequestType, data)
      } 
    }
    this.pbCaches[cacheName] = cacheData
    return cacheData
  },
  /** 請求前數據處理 */
  beforeSend (cb) {
    this.beforeSendEvent = cb.bind(this);
  },
  // 加密
  encode: function (desction, data)  {
    let dataDesction = desction
    if (typeof dataDesction === 'string') {
      dataDesction = this.pbRoot.lookupType(desction)
    }
    const err = dataDesction.verify(data)
    if (err) {
      return false
    } else {
      const message = dataDesction.create(data)
      const buffer = dataDesction.encode(message).finish()
      return buffer
    }
  },
  // 解密
  decode: function (desction, data) {
    let dataDesction = desction;
    if (typeof dataDesction === 'string') {
      dataDesction = this.pbRoot.lookupType(desction);
    }
    const err = dataDesction.verify(data)
    if (err) {
      return false
    } else {
      const res = dataDesction.decode(data)
      const result = dataDesction.toObject(res, {
        defaults: true,
      })
      return result
    }
  }
};

const apiCall:ApiCall = new Proxy(sourceApiCall, {
  get (_this, funcName):()=> Promise<object>|any {
    // 如果已有方法屬性, 則返回已有方法屬性
    if (_this[String(funcName)]) {
      return _this[String(funcName)]
    }
    return (async (data = {}, options:RequeryParams = {}, beforeSendEvent?: Parameters<ApiCall['beforeSend']>[0] ):Promise<object> => {
      // 未初始化
      if (!_this.pbRoot) {
        // _this.initRoot(actPbJson);
        _this.initRoot({});
      }
      if (typeof funcName !== "string") {
        throw '錯誤: funcName 必須為字串'
      }
      // 構建參數
      let params:RequeryParams = deepMerge({
        funcName,
        token: '',
        // reqDesction: `${String(funcName)}Req`,
        // resDesction: `${String(funcName)}Res`,
        // serverName: `mizos.${fileName}.${firstWordUpperCase(fileName)}ExtObj`,
        data,
      }, options)
      const apiPb = _this.apiPbFunc(funcName, params.serverName);
      // 補全屬性
      if (!params.reqDesction) {
        params.reqDesction = apiPb.requestType
      }
      if (!params.resDesction) {
        params.resDesction = apiPb.responseType
      }
      if (!params.serverName) {
        params.serverName = apiPb.serverName
      }
      
      if (_this.beforeSendEvent || beforeSendEvent) {
        try {
          params = await (_this.beforeSendEvent || beforeSendEvent)(params) || params;
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return params
    }) as ApiCallFun<object, object>
  }
})

export default apiCall;
