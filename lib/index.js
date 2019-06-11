'use strict'

var debug = require('debug')('authbroker')
var authFind = require('./authFind')

function authBroker(setting) {
  debug('authentication function is running...')
  this.setting = setting
}



/*
  Used when the device is sending credentials.
  mqtt.username must correspond to the table username in the mongoDB table
  mqtt.password must correspond to the device password
*/
authBroker.prototype.authenticateMQTT = function () {
  var self = this
  debug('authenticate with credentials request!')
  return async function (client, username, password, callback) {
    var data = {
      id: client.id, // {client-name}
      realm: username,
      token: password.toString(),
      type: 'mqtt'
    }

    var find = new authFind(self.setting)
    var result = await find.reviewClient(data)

    if (result && result.paraffinAuth) {
      debug('MQTT Auth. +Passed')
      client.deviceProfile = result // profile attached to the client object
      return callback(null, true, client.deviceProfile)
    } else {
      debug('UserName or Password is wrong.')
      return callback(null, false)
    }

  }
}


authBroker.prototype.authorizePublishMQTT = function () {
  var self = this
  return function (client, topic, payload, callback) {
    var review = new authFind(self.setting)
    client.deviceProfile.lastPub = new Date()
    let PublishMQTT = {
      adapter: 'mqtt',
      type: 'publish',
      topic: topic,
      payload: payload,
      client: client
    }
    callback(null, review.reviewACL(PublishMQTT))
  }
}

authBroker.prototype.authorizeSubscribeMQTT = function () {
  var self = this
  return function (client, topic, callback) {
    var review = new authFind(self.setting)
    let SubscribeMQTT = {
      adapter: 'mqtt',
      type: 'subscribe',
      topic: topic,
      client: client
    }
    callback(null, review.reviewACL(SubscribeMQTT))
  }
}

/**
 * @param {Object} req The incoming message @link https://github.com/mcollina/node-coap#incoming
 * @param {Function} callback The callback function. Has the following structure: callback(error, authenticated, subject)
 */
authBroker.prototype.authenticateHTTP = function () {
  var self = this
  return async function (req, callback) {
    var find = new authFind(self.setting)

    var url = req.url
    var checkReq = req && req.url && req.headers && req.headers.authorization
    if (!checkReq) {
      debug('Request scheme is undifined.')
      return callback(null, false)
    }

    if (req.headers.authorization.startsWith('Basic')) {
      debug('HTTP Request is in Basic Authentication')

      // grab the encoded value
      var encoded = req.headers.authorization.split(' ')[1]
      // decode it using base64
      var decoded = Buffer.from(encoded, 'base64').toString()
      var name = decoded.split(':')[0]
      var password = decoded.split(':')[1]
      debug(name + ' and ' + password)
      //var clientId = req.headers[Object.keys(req.headers).indexOf('x-api-key')]
      var clientId = req.headers['x-client-id']
      // check if the passed username and password match with the values in database.
      // this is dummy validation.

      var data = {
        id: clientId, // {client-name}
        realm: name,
        token: password,
        type: 'http',
      }

      var result = await find.reviewClient(data)
      //debug('########## result :::')
      //debug(result)

      if (result && result.paraffinAuth) {
        debug('+++Passed to GET HTTP')
        req.deviceProfile = result // profile attached to the client object
        return callback(null, true, req)
      } else {
        debug('Name or Password is wrong.')
        return callback(null, false)
      }
    }



  }
}

// Examples:
//   Error:             callback(error)
//   Authenticated:     callback(null, true, { username: 'someone' })
//   Not authenticated: callback(null, false)

/**
 * @param {Object} subject The subject returned by the authenticate function
 * @param {string} topic The topic
 * @param {Function} callback The callback function. Has the following structure: callback(error, authorized)
 */

authBroker.prototype.authorizeGetHTTP = function () {
  var self = this
  return function (subject, topic, callback) {
    var review = new authFind(self.setting)
    let GetHTTP = {
      adapter: 'http',
      type: 'get',
      topic: topic,
      client: subject
    }
    callback(null, review.reviewACL(GetHTTP))
  }
  // Examples:
  //   Error:          callback(error)
  //   Authorized:     callback(null, true)
  //   Not authorized: callback(null, false)
}

/**
 * @param {Object} subject The subject returned by the authenticate function
 * @param {string} topic The topic
 * @param {Buffer} payload The payload
 * @param {Function} callback The callback function. Has the following structure: callback(error, authorized)
 */
authBroker.prototype.authorizePutHTTP = function () {
  var self = this
  return function (subject, topic, payload, callback) {
    var review = new authFind(self.setting)
    let PutHTTP = {
      adapter: 'http',
      type: 'put',
      payload: payload,
      topic: topic,
      subject: subject
    }
    callback(null, review.reviewACL(PutHTTP))
  }
  // Examples:
  //   Error:          callback(error)
  //   Authorized:     callback(null, true)
  //   Not authorized: callback(null, false)
}


module.exports = authBroker
