var debug = require('debug')('authbroker')
var Qlobber = require('qlobber').Qlobber



function reviewAccess(setting) {
    this.setting = setting
}


reviewAccess.prototype.reviewAccess = function (funcType) {
    var self = this
    console.log('reviewAccess +')
    var acl = funcType.client.deviceProfile.adapters.topics

    self.setting.wildCard = self.setting.wildCard || {}
    var _matcher = new Qlobber({
        separator: self.setting.wildCard.separator || '/',
        wildcard_one: self.setting.wildCard.wildcardOne || '+',
        wildcard_some: self.setting.wildCard.wildcardSome || '#'
    })

    for (var i = 0; i < acl.length; i++)
        _matcher.add(acl[i].topic, i)

    var matchPoint = _matcher.match(funcType.topic)
    if (matchPoint === []) return false

    var acli = acl[matchPoint[0]]
    //var setting = acl.setting
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
            //console.log('>>publish authorization: '+ isValid)
            return isValid
        }

        if (funcType.type === 'subscribe') {
            let rightMethod = acli.type === 'rw' || acli.type === 'r'
            let isValid = rightMethod
            if (!isValid) debug('Subscribe MQTT is not permitted.')
            //console.log('>>subscribe authorization: '+ isValid)
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



module.exports = reviewAccess
