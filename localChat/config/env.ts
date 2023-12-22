const config = {
  common: {
    jwt: {
      header: {
        type: 'JWT',
        alg: 'HS256'
      },
      payload : {},
      signature : {},
    }

  },
  prod: {
    secret: {
      
    }

  },
  beta: {

  }
}
export default config