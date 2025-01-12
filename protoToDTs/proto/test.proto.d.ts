import {common} from "./common.proto";
export namespace test {
export enum NumType {
  Num = 0,
  Hour = 1,
  Day = 2,
  Minute = 3,
  Forever = 4,
}
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
  function TestApi (data: TestApiReq): TestApiRes;
}
