'use strict'

var debug = require('debug')('authbroker')
require('./util')

// Database Collection

var Default = {}

function AuthIOK(Settings) {
  debug('authentication function is running...')
  Default = {
    db: {
      url: Settings.db.url,
      db: Settings.name
    },
    salt: Settings.salt,
    mqtt: {
      keep_alive: 60,         // keep alive time in seconds
      clean_session: true,
      willTopic: '',
      willQoS: 1,
      willRetain: false,
      willPayload: '',
      connectTimeout: 10000,  //ms
      reconnectPeriod: 3000,  //ms
      limitMPM: Settings.limitMPM,  // Message per Minute limit in Publish
      limitW: Settings.limitW // Max size for Publishing payload in kB
    },
    http: {},
    coap: {}
  }
}



/*
  Used when the device is sending credentials.
  mqtt.username must correspond to the table username in the mongoDB table
  mqtt.password must correspond to the device password
*/
AuthIOK.prototype.authenticateMQTT = function () {
  debug('authenticate with credentials request!')
  return async function (client, username, password, callback) {
    var data = {
      id: client.id, // {client-name}
      realm: username,
      token: password.toString(),
      type: 'mqtt'
    }

    var result = await reviewClient(data)

    if (result && result.paraffinAuth) {
      debug('+++MQTT Auth Passed')
      client.deviceProfile = result // profile attached to the client object
      return callback(null, true)
    } else {
      debug('Name or Password is wrong.')
      return callback(null, false)
    }

  }
}


AuthIOK.prototype.authorizePublishMQTT = function () {
  return function (client, topic, payload, callback) {
    // var isOwner = topic.indexOf(client.deviceProfile.name) == 0 || topic.indexOf(client.deviceProfile.clientId) == 0
    var isValid =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(topic) > -1
    if (!isValid) debug('Publish MQTT is not authorized')
    callback(null, isValid)
  }
}

AuthIOK.prototype.authorizeSubscribeMQTT = function () {
  return function (client, topic, callback) {
    // var isOwner = topic.indexOf(client.deviceProfile.name) == 0 || topic.indexOf(client.deviceProfile.clientId) == 0
    var isValid =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(topic) > -1
    if (!isValid) debug('Subscribe MQTT is not authorized')
    callback(null, isValid)
  }
}

/**
 * @param {Object} req The incoming message @link https://github.com/mcollina/node-coap#incoming
 * @param {Function} callback The callback function. Has the following structure: callback(error, authenticated, subject)
 */
AuthIOK.prototype.authenticateHTTP = function () {
  var self = this

  return function (req, callback) {
    var url = req.url
    var tenantId = url.split('/')[2]
    // debug('Tenant Id: ' + tenantId)

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
      // debug(name + ' and ' + password)
      // check if the passed username and password match with the values in database.
      // this is dummy validation.

      var data = {
        id: tenantId, // {client-name}
        name: name,
        token: password,
        type: 'http',
        grant_type: 'password',
        scope: 'openid profile'
      }

      debug('$$$$$$$$$$$ data::')
      debug(data)

      var result = reviewClient(data)
      debug('########## result :::')
      debug(result)

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

AuthIOK.prototype.authorizeGetHTTP = function () {
  return function (subject, topic, callback) {
    debug('*************************')
    debug(subject)
    // var isOwner = topic.indexOf(subject.deviceProfile.name) == 0 || topic.indexOf(subject.deviceProfile.clientId) == 0
    var isValid =
      subject.deviceProfile &&
      subject.deviceProfile.topics &&
      subject.deviceProfile.topics.indexOf(topic) > -1
    if (!isValid) debug('Get request is not permitted')
    callback(null, isValid)
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
AuthIOK.prototype.authorizePutHTTP = function () {
  return function (subject, topic, payload, callback) {
    // var isOwner = topic.indexOf(subject.deviceProfile.name) == 0 || topic.indexOf(subject.deviceProfile.clientId) == 0
    var isValid =
      subject.deviceProfile &&
      subject.deviceProfile.topics &&
      subject.deviceProfile.topics.indexOf(topic) > -1
    if (!isValid) debug('PUT request is not permitted')
    callback(null, isValid)
  }
  // Examples:
  //   Error:          callback(error)
  //   Authorized:     callback(null, true)
  //   Not authorized: callback(null, false)
}


module.exports = AuthIOK
