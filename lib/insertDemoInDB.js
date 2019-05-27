// we create 'users' collection in newdb database
var url = 'mongodb://localhost:27017/paraffin'

// create a client to mongodb
const MongoClient = require('mongodb').MongoClient
const crypto = require('crypto')

var yesterday = new Date()
var today = new Date()
var tomorrow = new Date()

tomorrow.setDate(today.getDate() + 1)
yesterday.setDate(today.getDate() - 1)

const config = {
  iterations: 872791,
  hashBytes: 64,
  digest: 'sha512',
  salt: 'salt'
}

// Generate PBKDF2 hash
function pbkdf2(value) {

  //return new Promise((resolve, reject) => {

    const {
      iterations,
      hashBytes,
      digest,
      salt
    } = config

    key = crypto.pbkdf2Sync(value, salt, iterations, hashBytes, digest)
      
      console.log('Hashed > ' + value + ' : ' + key.toString('base64'))
      //resolve(key.toString('base64'))
      return key.toString('base64')
    }


// make client connect to mongo service
MongoClient.connect(
  url,
  function (err, db) {
    if (err) throw err
    // db pointing to newdb
    console.log('Switched to ' + db.databaseName + ' database')

    // documents to be inserted
    var docs = [
      {
        realm: 'mohammad',
        clientId: 'u103',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'pbkdf2', pwdhash: pbkdf2('hadi'), startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,
            secret: { type: 'pbkdf2', pwdhash: pbkdf2('hadi'), startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
          },
          {
            type: 'coap',
            enabled: false
          }
        ]
      },
      {
        realm: 'mahdi',
        clientId: 'm313',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'pbkdf2', pwdhash: pbkdf2('rasoul'), startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,  // Authorization: Basic bWFoZGk6aGFkaQ==
            secret: { type: 'pbkdf2', pwdhash: pbkdf2('rasoul'), startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
          },
          {
            type: 'coap',
            enabled: false
          }
        ]
      },
      {
        realm: 'ali',
        clientId: 'a110',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'amir', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,   //Authorization: Basic YWxpOmFtaXI=
            secret: { type: 'basic', pwdhash: 'amir', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          },
          {
            type: 'coap',
            enabled: false
          }
        ]
      },
      {
        realm: 'username',
        clientId: 'u911',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'password', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,  // Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
            secret: { type: 'basic', pwdhash: 'password', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          },
          {
            type: 'coap',
            enabled: false
          }
        ]
      },
      {
        realm: 'hello',
        clientId: 'hi313',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'rasoul', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'hadi', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          },
          {
            type: 'coap',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'hadi', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          }
        ]
      },
      {
        realm: 'hello',
        clientId: 'hi110',
        adapters: [
          {
            type: 'mqtt',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'yaali', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
            keepAlive: 20,
            limitW: 50,  //50kb is allowable for writting packet data in every publish
            limitMPM: 3 // 3 messages per minute can write
          },
          {
            type: 'http',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'yaali', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          },
          {
            type: 'coap',
            enabled: true,
            secret: { type: 'basic', pwdhash: 'yaali', startAfter: yesterday, expiredBefore: tomorrow },
            topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
          }
        ]
      }
    ]


    db.collection('auth').drop(function (err, delOK) {
      if (err) console.log('Collection drop error')
      if (delOK) console.log('Collection deleted')
      db.close()
    })

    // insert multiple documents to 'users' collection using insertOne
    db.collection('auth').insertMany(docs, function (err, res) {
      if (err) throw err
      console.log(res.insertedCount + ' documents inserted')
      // close the connection to db when you are done with it
      db.close()
    })
  }
)
