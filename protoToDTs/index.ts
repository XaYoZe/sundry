import API from '@apiCall';
import './proto/index'

API.TestApi({name: 'string'}).then(res => {
  res.bool1
})