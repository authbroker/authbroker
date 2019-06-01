'use strict'

var ponte = require('ponte')
var AuthBroker = require('../lib/index')

var envAuth = {
  db: {
    type: 'mongo',
    url: 'mongodb://localhost:27017/paraffin',
    option: {}
  },
  salt: {
    salt: 'salt', //salt by pbkdf2 method
    digest: 'sha512',
    // size of the generated hash
    hashBytes: 64,
    // larger salt means hashed passwords are more resistant to rainbow table, but
    // you get diminishing returns pretty fast
    saltBytes: 16,
    // more iterations means an attacker has to take longer to brute force an
    // individual password, so larger is better. however, larger also means longer
    // to hash the password. tune so that hashing the password takes about a
    // second
    iterations: 10
  },
  adapters: {
    mqtt: {
      limitW: 50,
      limitMPM: 10
    },
    http: {},
    coap: {}
  }
}


var auth = new AuthBroker(envAuth)

var ponteSettings = {
  logger: {
    level: 'info',
    name: 'ParaffinIoT'
  },
  http: {
    port: 3000,
    authenticate: auth.authenticateHTTP(),
    authorizeGet: auth.authorizeGetHTTP(),
    authorizePut: auth.authorizePutHTTP()
  },
  mqtt: {
    port: 1883, // tcp
    authenticate: auth.authenticateMQTT(),
    authorizePublish: auth.authorizePublishMQTT(),
    authorizeSubscribe: auth.authorizeSubscribeMQTT()
  },
  coap: {
    port: 2345, // udp
    authenticate: auth.authenticateHTTP(),
    authorizeGet: auth.authorizeGetHTTP(),
    authorizePut: auth.authorizePutHTTP()
  },
  persistence: {
    // same as http://mcollina.github.io/mosca/docs/lib/persistence/mongo.js.html
    type: 'mongo',
    url: 'mongodb://localhost:27017/ponte'
  },
  broker: {
    // same as https://github.com/mcollina/ascoltatori#mongodb
    type: 'mongo',
    url: 'mongodb://localhost:27017/ponte'
  }
}

var server = ponte(ponteSettings)

server.on('clientConnected', function (client) {
  console.log('Client connected', client.id)
})

// fired when a message is received
server.on('published', function (packet, client) {
  console.log('Published', packet.payload)
})

server.on('updated', function (resource, buffer) {
  console.log('Resource Updated', resource, buffer)
})

server.on('ready', setup)

// fired when the server is ready
function setup() {
  console.log('Brokero is up and running')
}
