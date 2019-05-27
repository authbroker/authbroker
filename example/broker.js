'use strict'

var ponte = require('ponte')
var AuthBroker = ('../lib/index')

var envAuth = {
  db: {
    url: 'mongodb://localhost:27017/',
    name: 'paraffin'
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
    iterations: 872791
  },
  mqtt: {
    limitW: 50,
    limitMPM: 10
  },
  http: {},
  coap: {}
}


var auth = new AuthBroker(envAuth)

var ponteSettings = {
  logger: {
    level: config('LOG_LEVEL'),
    name: config('APP_NAME')
  },
  http: {
    port: config('HTTP_PORT'),
    authenticate: auth.authenticateHTTP(),
    authorizeGet: auth.authorizeGetHTTP(),
    authorizePut: auth.authorizePutHTTP()
  },
  mqtt: {
    port: config('MQTT_PORT'), // tcp
    authenticate: auth.authenticateMQTT(),
    authorizePublish: auth.authorizePublishMQTT(),
    authorizeSubscribe: auth.authorizeSubscribeMQTT()
  },
  coap: {
    port: config('COAP_PORT'), // udp
    authenticate: auth.authenticateHTTP(),
    authorizeGet: auth.authorizeGetHTTP(),
    authorizePut: auth.authorizePutHTTP()
  },
  persistence: {
    // same as http://mcollina.github.io/mosca/docs/lib/persistence/mongo.js.html
    type: 'mongo',
    url: config('DB_PONTE_NAME')
  },
  broker: {
    // same as https://github.com/mcollina/ascoltatori#mongodb
    type: 'mongo',
    url: config('DB_PONTE_NAME')
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
