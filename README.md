# Authentication and Authorization Module for Brokers

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/) [![Build Status](https://travis-ci.org/authbroker/authbroker.svg)](https://travis-ci.com/authbroker/authbroker) [![Greenkeeper badge](https://badges.greenkeeper.io/authbroker/authbroker.svg)](https://greenkeeper.io/)

<div align="center">
    <img src="https://github.com/authbroker/authbroker/blob/master/docs/asset/repository-open-graph.png" width="500px"</img> 
</div>

Authentication and Authorization module of HTTP/MQTT/CoAP Brokers based on NodeJS for IoT or Internet of Things. This repo is under development.


##  Getting Started

* Install mongo locally using [how to install mongodb](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04) and [Mongo docs](https://docs.mongodb.com/manual/administration/install-community/). Make sure it's working.
* If you want to run a test locally, clone this repo.

``` bash
git clone https://github.com/authbroker/authbroker
cd authbroker
npm install
node ./example/broker.js
```

* If you are running in Development mode, for using a Demo DB you can run
``` bash
node ./example/insertDemoDB.js
```
It fills DB with demo clients and users. 


### How Using it
This module use Node-style callback and it can be used with different brokers like [Mosca](https://github.com/mcollina/mosca), [Aedes](https://github.com/mcollina/aedes), [Ponte](http://github.com/eclipse/ponte).

``` js
'use strict'
var ponte = require('ponte')
var authBroker = require('@authbroker/authbroker')

var envAuth = {
  db: {
    type: 'mongo',  //database type
    url: 'mongodb://localhost:27017/paraffin',  //database url
    collectionName: 'authBroker', //in vertical methodology, refer to collectionName
    methodology: 'vertical',  // database artichecture will being vertical or horzintal
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
  wildCard: {
    wildcardOne: '+',
    wildcardSome: '#',
    separator: '/'
  },
  adapters: { // adapters setting
    mqtt: {},
    http: {},
    coap: {}
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

// fired when the server is ready
server.on('ready', function() {
  console.log('Broker is up and running')
})
```


The authentication performs with Mongodb server directly. You can change and customize Mongodb server settings with environemt variables. Data structure in Mongodb is like these;

``` javascript
{  
   realm:'hello',
   clientId:'hi313',
   adapters:[  
      {  
         type:'mqtt',
         enabled:true,
         secret:{  
            type:'basic',
            pwdhash:'allah',
            startAfter: ISODate,
            expiredBefore: ISODate
         },
         topics:[  
            {  
               topic:'temperature',
               action:'allow',
               type:'rw'
            },
            {  
               topic:'ali/+/hello',
               action:'allow',
               type:'r'
            }
         ]
      },
      {  
         type:'http',
         enabled:true,
         secret:{  
            type:'pbkdf2',
            pwdhash:'qdsaFGhas2eW2Csgj'
         },
         topics:[  
            {  
               topic:'hi313/#',
               action:'allow',
               type:'rw'
            }
         ]
      }
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
