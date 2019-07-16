var benchmark = require('@authbroker/mongo-benchmark')

var opts = {
  db: {
    url: 'mongodb://localhost:27017/paraffin',
    collectionName: 'authBroker',
    methodology: 'horizontal'
  },
  salt: {
    iterations: 10,
    hashBytes: 64,
    digest: 'sha512',
    salt: 'salt'
  }
}

var demo = new benchmark(opts)

validData = demo.validData()

demo.readData({ clientId: validData[1].clientId, realm: validData[1].realm }, function (res) {
  // save valid demo data to db
  if (!res)
    demo.insertValidData(function () {
      console.log('Demo is ready...')
    })
})