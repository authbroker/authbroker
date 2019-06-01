# Authentication and Authorization Module for Brokers

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/) [![Build Status](https://travis-ci.org/authbroker/authbroker.svg)](https://travis-ci.com/authbroker/authbroker) [![Greenkeeper badge](https://badges.greenkeeper.io/authbroker/authbroker.svg)](https://greenkeeper.io/)

Authentication and Authorization module of HTTP/MQTT/CoAP Brokers based on NodeJS for IoT or Internet of Things.


##  Getting Started

* Install mongo locally using [how to install mongodb](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04) and [Mongo docs](https://docs.mongodb.com/manual/administration/install-community/). Make sure it's working.
* If you want to run a test locally, clone this repo.

``` bash
git clone https://github.com/authbroker/authbroker
cd authbroker
npm install
npm test
```

* If you are running in Development mode, for using a Demo DB you can run
``` bash
node ./lib/insertDemoDB.js
```
It fill DB with demo clients and users. 


### How Using it
This module can be used with different brokers like [Mosca](https://github.com/mcollina/mosca), [Aedes](https://github.com/mcollina/aedes), [Ponte](http://github.com/eclipse/ponte).

``` js

'use strict'

var ponte = require('ponte')
var authBroker = ('authbroker')  // visit 

var envAuth = {
  db: {
    url: 'mongodb://localhost:27017/authbroker'
  }
}

var auth = new authBroker(envAuth)

var ponteSettings = {
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
  console.log('Broker is up and running')
}

```


The authentication performs with Mongodb server directly. You can change and customize Mongodb server settings with environemt variables. Data structure in Mongodb is like these;

``` javascript

  {
    realm: 'hello',
    clientId: 'hi313',
    adapters: [
      {
        type: 'mqtt',
        enabled: true,
        secret: { type: 'basic', pwdhash: 'allah', startAfter: yesterday, expiredBefore: tomorrow },
        topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*'],
        keepAlive: 20,
        limitW: 50,  //50kb is allowable for writting packet data in every publish
        limitMPM: 3 // 3 messages per minute can write
      },
      {
        type: 'http',
        enabled: true,
        secret: { type: 'pbkdf2', pwdhash: 'qdsaFGhas32eWGWa=AD2Csgj', startAfter: yesterday, expiredBefore: tomorrow },
        topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
      },
      {
        type: 'coap',
        enabled: true,
        secret: { type: 'basic', pwdhash: 'hadi', startAfter: yesterday, expiredBefore: tomorrow },
        topics: ['hello', 'username', 'mahdi/hello', 'mohammad', '*']
      }
    ]
  }

```


## Contributing

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

Anyone with interest in or experience with the following technologies are encouraged to join the project.
And if you fancy it, join the [Telegram group](t.me/joinchat/AuKmG05CNFTz0bsBny9igg) here for Devs and say Hello!


## Authors / Contributors

* [Hadi Mahdavi](https://twitter.com/kamerdack)



## Credits / Inspiration

* Matteo Collina for Mosca, Aedes, Ponte (https://github.com/mcollina/mosca)
* Eugenio Pace for Auth0 Mosca inspiration (https://github.com/eugeniop/auth0mosca)


## Copyright

MIT - Copyright (c) 2019 ioKloud