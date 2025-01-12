declare namespace common {
  export enum CommonType {
    
    A = 1,
    
    B = 2,
    
    C = 3,
  }

  export interface service {
    CommonAPi: { requestType: CommonType, responseType: CommonType};
  }

}