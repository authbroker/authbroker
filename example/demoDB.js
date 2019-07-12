var debug = require('debug')
var benchmark = require('@authbroker/mongo-benchmark')
 
var opts = {
  db: {
    url: 'mongodb://localhost:27017/paraffin',
    collectionName: 'authBroker',
    methodology: 'vertical'
  },
  salt: {
    iterations: 10,
    hashBytes: 64,
    digest: 'sha512',
    salt: 'salt'
  }
}

var demo = new benchmark(opts)
 
// print valid demo data list
debug(demo.getValidData())
 
// save valid demo data to db
demo.insertValidData()