var debug = require('debug')('authbroker')
const crypto = require('crypto')
var lookup = require('./mongo')


function reviewClient(setting) {
  this.setting = setting
  /*
  if (setting.db.type === 'mongo')
    this.lookup = require('./mongo')
    */
}



reviewClient.prototype.reviewClient = function (data) {
  var self = this
  return new Promise((resolve, reject) => {
    debug('reviewClient is Starting')
      var now = new Date()
    var find = new lookup(self.setting.db)
    find.findClient(data, function (res) {
      debug(res)
      let checkResult = res && 'adapters' in res
      if (!checkResult) {
        let error = {
          error: 'Request scheme is undifined.',
          code: '603'
        }
        debug('Error from reviewClient')
        debug('Request scheme is undifined.')
        reject(error)
        return
      }

      if (res && 'error' in res) {
        debug('Error: ' + res.error)
        reject(res.error)
        return
      }

      var i
      for (i = 0; i < res.adapters.length; i++)
        if (res.adapters[i].type === data.type) break

      if (!res.adapters[i].enabled) {
        self.error = {
          error: 'Adapter is disable.',
          code: '703'
        }
        debug('Error from reviewClient')
        debug(self.error)
        reject(self.error)
        return
      }

      var hashedpassword
      var permission

      if (res.adapters[i].secret.type.toString() === 'basic') {
        debug('Passoword is Basic')
        hashedpassword = data.token
      }

      if (res.adapters[i].secret.type.toString() === 'pbkdf2') {
        debug('Passoword salted by pbkdf2')
        var key = crypto.pbkdf2Sync(data.token, self.setting.salt.salt, self.setting.salt.iterations, self.setting.salt.hashBytes, self.setting.salt.digest)
        hashedpassword = key.toString('base64')
        debug(hashedpassword)  // '3745e48...08d59ae'
      }

      permission = res.adapters[i].secret.pwdhash === hashedpassword

      var isDate = function (date) {
        return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date))) ? true : false
      }

      if (res.adapters[i].secret.startAfter && isDate(res.adapters[i].secret.startAfter)) {
        permission = permission && ((new Date(res.adapters[i].secret.startAfter) - now) < 0)
        if (!permission) debug('Date is before startAfter')
      }

      if (res.adapters[i].secret.expiredBefore && isDate(res.adapters[i].secret.expiredBefore)) {
        permission = permission && ((new Date(res.adapters[i].secret.expiredBefore) - now) > 0)
        if (!permission) debug('Date is after expiredBefore')
      }

      if (permission) {
        var authcallback = {
          paraffinAuth: true,
          adapters: res.adapters[i]
        }
        debug('Auth is Ok!')
        resolve(authcallback)
        return
      } else {
        self.error = {
          error: 'Permission is denied.',
          code: '503'
        }
        debug(self.error)
        reject(self.error)
        return
      }
    })
  })
}



module.exports = reviewClient
