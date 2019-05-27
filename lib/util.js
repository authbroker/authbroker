var debug = require('debug')('authbroker')
// const joi = require('joi')
const MongoClient = require('mongodb').MongoClient
const crypto = require('crypto')



function findClient(data, callback) {
    const findDocument = function (db, cb) {
      // Get the documents collection
      const collection = db.collection(Default.db.authCollectionName)
      // Find some documents
      collection.findOne(
        {
          // clientId: data.id
          name: data.name
        },
        function (err, doc) {
          if (err) {
            debug('Mongodb error: ' + err)
            var error = {
              error: err,
              code: '503'
            }
            return cb(error)
          }
          cb(doc)
        }
      )
    }

    // Use connect method to connect to the server
    MongoClient.connect(
      Default.db.authUrl,
      function (err, client) {
        if (err) {
          debug('Mongodb error: ' + err)
          var error = {
            error: err,
            code: '503'
          }
          return callback(error)
        }
        const db = client.db(Default.db.authName)
        findDocument(db, function (cb) {
          client.close()
          return callback(cb)
        })
      }
    )
  }
  


function reviewClient(data) {
    //AuthIOK.prototype.reviewClient = function (data, reject) {
    var error
    return new Promise(resolve => {
      debug('reviewClient is Starting')
      findClient(data, function (callback) {
        let now = new Date()
        debug(callback)
        let checkResult =
          callback &&
          callback.adapters &&
          callback.realm
  
        if (!checkResult) {
          error = {
            error: 'Request scheme is undifined.',
            code: '503'
          }
          debug('Error from reviewClient')
          debug('Request scheme is undifined.')
          resolve(error)
          return error
  
        }
  
        if (callback && callback.error) {
          debug('Error: ' + callback.error)
          resolve(error)
          return error
        }
  
        var i
        for (i = 0; i < callback.adapters.length; i++)
          if (callback.adapters[i].type === data.type) break
  
        var hashedpassword
        var permission
  
        if (callback.adapters[i].secret.type.toString() === 'basic') {
          debug('Passoword is Basic')
          hashedpassword = data.token
        }
  
        if (callback.adapters[i].secret.type.toString() === 'pbkdf2') {
          debug('Passoword salted by pbkdf2')
          var key = crypto.pbkdf2Sync(data.token, Default.db.secret.salt, Default.db.secret.iterations, Default.db.secret.hashBytes, Default.db.secret.digest)
          hashedpassword = key.toString('base64')
          debug(hashedpassword)  // '3745e48...08d59ae'
        }
  
        permission = callback.adapters[i].secret.pwdhash === hashedpassword
  
        var isDate = function (date) {
          return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date))) ? true : false
        }
  
        if (callback.adapters[i].secret.startAfter && isDate(callback.adapters[i].secret.startAfter)) {
          permission = permission && ((new Date(callback.adapters[i].secret.startAfter) - now) < 0)
        }
  
        if (callback.adapters[i].secret.expiredBefore && isDate(callback.adapters[i].secret.expiredBefore)) {
          permission = permission && ((new Date(callback.adapters[i].secret.expiredBefore) - now) > 0)
        }
  
        if (permission) {
          var authcallback = {
            paraffinAuth: true,
            adapters: callback.adapters[i]
          }
          debug('Auth is Ok!')
          debug(authcallback)
          resolve(authcallback)
          return authcallback
        } else {
          error = {
            error: 'Permission is denied.',
            code: '503'
          }
          debug(error)
          resolve(error)
          return error
        }
      })
    })
  }
  
  
  
  function reviewACL(funcType, deviceProfile, topic, payload) {
    var acl = deviceProfile
    var setting = acl.setting
    var lastPub = acl.lastPub
    if (setting.public) return true
    for (i = 0; i < acl.length; i++) {
      if ((acl[i].topic === topic) && acl[i].enabled) {
        let acli = acl[i]
        debug('position: ' + i)
        if (acli.limitMPM === 0) return false
        let now = new Date()
  
        if (funcType === 'PublishMQTT') {
          let rightMethod = acli.method === 'rw' || acli.method === 'w'
          if (setting.limitW) {
            var rightLength = (payload.length / 1024) <= setting.limitW
          } else {
            var rightLength = (payload.length / 1024) <= DEFAULT.limitW
          }
          if (setting.limitMPM) {
            var rightMPM = getMilliseconds(now - lastPub) >= (1000 * 60 / setting.limitMPM)
          } else {
            var rightMPM = getMilliseconds(now - lastPub) >= (1000 * 60 / DEFAULT.limitMPM)
          }
          let isValid = rightMethod && rightLength && rightMPM
          if (!isValid) debug('Publish MQTT is not permitted.')
          return isValid
        }
  
        if (funcType === 'SubscribeMQTT') {
          let rightMethod = acli.method === 'rw' || acli.method === 'r'
          let isValid = rightMethod
          if (!isValid) debug('Subscribe MQTT is not permitted.')
          return isValid
        }
  
        if (funcType === 'PutHTTP') {
          let rightMethod = acli.method === 'rw' || acli.method === 'w'
          let isValid = rightMethod
          if (!isValid) debug('Put HTTP is not permitted.')
          return isValid
        }
  
        if (funcType === 'GetHTTP') {
          let rightMethod = acli.method === 'rw' || acli.method === 'r'
          let isValid = rightMethod
          if (!isValid) debug('Get HTTP is not permitted.')
          return isValid
        }
  
        return false
      }
    }
  }
  
  
  /*
  
  AuthIOK.prototype.reviewClient = async function (data, reject) {
    var self = this
    var error
  
    self.findClient(data, function (result) {
      debug(result)
      let checkResult =
        result &&
        result.adapter &&
        result.secret &&
        result.secret.type &&
        result.secret.pwdhash &&
        result.name &&
        result.topics
      if (!checkResult) {
        error = {
          error: 'Request scheme is undifined.',
          code: '503'
        }
        debug('Request scheme is undifined.')
        return reject(error)
      }
  
      if ('error' in result) {
        debug('Error: ' + result.error)
        return reject(error)
      }
  
      if (result.adapter.indexOf('http') < 0 && result.adapter.indexOf('*') < 0) {
        debug('HTTP is not permitted')
        error = {
          error: 'http is not permitted',
          code: '503'
        }
        return reject(error)
      }
  
      var hashedpassword
      if (result.secret.type.toString() === 'openid') {
        debug('Passoword is OpenID')
        hashedpassword = data.token
      }
  
      if (result.name === data.name && result.secret.pwdhash === hashedpassword) {
        result.paraffinAuth = true
        debug('Auth is Ok!')
        return reject(result)
      } else {
        error = {
          error: 'Name or Password is wrong.',
          code: '503'
        }
        debug('Name or Password is wrong.')
        return reject(error)
      }
    })
  }
  */
  