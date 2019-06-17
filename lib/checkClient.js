var debug = require('debug')('authbroker')
const crypto = require('crypto')



function reviewClient(setting) {
  this.setting = setting
  if (setting.db.type === 'mongo')
    this.lookup = require('./mongo')
}



reviewClient.prototype.reviewClient = function (data, secOption) {
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



module.exports = reviewClient
