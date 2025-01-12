declare namespace test {
  /** 上边 */
  export enum NumType {
    /** 个数 */
    Num = 0,
    /** 小时 */
    Hour = 1,
    /** 天数 */
    Day = 2,
    /** 分钟 */
    Minute = 3,
    /** 永久时长 */
    Forever = 4,
  }

  /** 隔
  一
  行 **/
  export interface TestApiRes {
    
    num1?: number
    
    str1?: string
    
    bytes1?: ArrayBuffer
    
    bool1?: boolean
    
    numType: NumType
    
    num2?: Array<number>
    
    str2?: string
    
    map: Record<number, Insert>
    
    commonType?: common.CommonType
  }

  /** 
      插入内容
    */
  export interface Insert {
    
    id?: number
  }

  export enum InsertEnum {
    
    A = 1,
    
    B = 2,
    
    C = 3,
  }

  export interface Insert2 {
    
    id?: number
  }

  export enum InsertEnum2 {
    
    A = 1,
    
    B = 2,
    
    C = 3,
  }

  export interface TestApiReq {
    
    name?: string
  }

  export interface service {
    /** 接口測試 */
    TestApi: { requestType: TestApiReq, responseType: TestApiRes};
  }

}