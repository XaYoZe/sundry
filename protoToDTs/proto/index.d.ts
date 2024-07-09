import './common.proto';
import './test.proto';
declare module '@apiCall' {
  type FormatApi<obj extends any> = {
    [key in keyof obj]: ApiCallFun<'requestType' extends keyof obj[key] ? obj[key]['requestType'] : any, 'responseType' extends keyof obj[key] ? obj[key]['responseType'] : ''>
  }
  export interface ApiProxy extends Partial<FormatApi<common.service&test.service>> {
  }
}