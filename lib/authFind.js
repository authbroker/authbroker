var debug = require('debug')('authbroker')
const crypto = require('crypto')


function authFind(setting) {
  this.setting = setting
  if (setting.db.type === 'mongo') this.lookup = require('./mongo')
}


authFind.prototype.reviewClient = function (data, secOption) {
  var self = this
  return new Promise(resolve => {
    debug('reviewClient is Starting')

    var now = new Date()
    self.find = new self.lookup(self.setting.db)
    self.find.findClient(data, function (callback) {
      debug(callback)

      let checkResult =
        callback &&
        callback.adapters

      if (!checkResult) {
        self.error = {
          error: 'Request scheme is undifined.',
          code: '603'
        }
        debug('Error from reviewClient')
        debug('Request scheme is undifined.')
        resolve(self.error)
        return self.error

      }

      if (callback && callback.error) {
        debug('Error: ' + callback.error)
        resolve(callback.error)
        return callback.error
      }

      var i
      for (i = 0; i < callback.adapters.length; i++)
        if (callback.adapters[i].type === data.type) break

      if (!callback.adapters[i].enabled) {
        self.error = {
          error: 'Adapter is disable.',
          code: '703'
        }
        debug('Error from reviewClient')
        debug(self.error)
        resolve(self.error)
        return self.error
      }

      var hashedpassword
      var permission

      if (callback.adapters[i].secret.type.toString() === 'basic') {
        debug('Passoword is Basic')
        hashedpassword = data.token
      }

      if (callback.adapters[i].secret.type.toString() === 'pbkdf2') {
        debug('Passoword salted by pbkdf2')
        var key = crypto.pbkdf2Sync(data.token, self.setting.salt.salt, self.setting.salt.iterations, self.setting.salt.hashBytes, self.setting.salt.digest)
        hashedpassword = key.toString('base64')
        debug(hashedpassword)  // '3745e48...08d59ae'
      }

      permission = callback.adapters[i].secret.pwdhash === hashedpassword

      var isDate = function (date) {
        return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date))) ? true : false
      }

      if (callback.adapters[i].secret.startAfter && isDate(callback.adapters[i].secret.startAfter)) {
        permission = permission && ((new Date(callback.adapters[i].secret.startAfter) - now) < 0)
        if (!permission) debug('Date is before startAfter')
      }

      if (callback.adapters[i].secret.expiredBefore && isDate(callback.adapters[i].secret.expiredBefore)) {
        permission = permission && ((new Date(callback.adapters[i].secret.expiredBefore) - now) > 0)
        if (!permission) debug('Date is after expiredBefore')
      }

      if (permission) {
        var authcallback = {
          paraffinAuth: true,
          adapters: callback.adapters[i]
        }
        debug('Auth is Ok!')
        resolve(authcallback)
        return authcallback
      } else {
        self.error = {
          error: 'Permission is denied.',
          code: '503'
        }
        debug(self.error)
        resolve(self.error)
        return self.error
      }
    })
  })
}



authFind.prototype.reviewACL = function (funcType) {
  var self = this
  debug(funcType.client.deviceProfile)
  var acl = funcType.client.deviceProfile.adapters
  //if (acl.lastPub) var lastPub = acl.lastPub
  //else var lastPub = new Date()
  let now = new Date()

  for (var i = 0; i < acl.length; i++)
    if (acl.topics[i].topic === funcType.topic) break
    else return false

  var acli = acl.topics[i]
  var setting = acl.setting
  if (!acli || acli.action && acli.action === 'deny')
    return false

  if (funcType.adapter === 'mqtt') {
    if (funcType.type === 'publish') {
      let rightMethod = acli.type === 'rw' || acli.type === 'w'
      /*
            console.log('limitWW: ' + setting)
            if (setting && 'limitW' in setting) {
              var rightLength = (funcType.payload.length / 1024) <= setting.limitW
              if (!rightLength) debug('rightLength Error MQTT.')
            } else {
              var rightLength = (funcType.payload.length / 1024) <= self.setting.adapters.mqtt.limitW
              if (!rightLength) debug('rightLength Error MQTT.')
            }
            if ('lastPub' in acl && setting && 'limitMPM' in setting) {
              var rightMPM = Math.abs(now - lastPub) <= (1000 * 60 / setting.limitMPM)
              if (!rightMPM) debug('rightLMPM 1 Error MQTT.')
              console.log(now)
              console.log(lastPub)
              console.log(Math.abs(now - lastPub))
            } else if ('lastPub' in acl) {
              var rightMPM = Math.abs(now - lastPub) >= (1000 * 60 / self.setting.adapters.mqtt.limitMPM)
              console.log(now)
              console.log(lastPub)
              console.log(Math.abs(now - lastPub))
              if (!rightMPM) debug('rightLMPM Error MQTT.')
            } else var rightMPM = true
            let isValid = rightMethod && rightLength && rightMPM
            */
      let isValid = rightMethod
      if (!isValid) debug('Publish MQTT is not permitted.')
      return isValid
    }

    if (funcType.type === 'subscribe') {
      let rightMethod = acli.type === 'rw' || acli.type === 'r'
      let isValid = rightMethod
      if (!isValid) debug('Subscribe MQTT is not permitted.')
      return isValid
    }
  }

  if (funcType.adapter === 'http') {
    if (funcType.type === 'put') {
      let rightMethod = acli.type === 'rw' || acli.type === 'w'
      /*
      if (setting.limitW) {
        var rightLength = (funcType.payload.length / 1024) <= setting.limitW
      } else {
        var rightLength = (funcType.payload.length / 1024) <= self.setting.adapters.http.limitW
      }

      let isValid = rightMethod && rightLength
      */
      let isValid = rightMethod
      if (!isValid) debug('Put HTTP is not permitted.')
      return isValid
    }

    if (funcType.type === 'get') {
      let rightMethod = acli.type === 'rw' || acli.type === 'r'
      let isValid = rightMethod
      if (!isValid) debug('Get HTTP is not permitted.')
      return isValid
    }
  }

  return false
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


module.exports = authFind