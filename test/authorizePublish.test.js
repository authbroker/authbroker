const authBroker = require("..")
const {
    test
} = require("tap")
let config = require("./config");
var packet = {
    topic: 'garden/fan',
    cmd: 'publish'
}

const authbroker = new authBroker(config.keycloak)

var clientOk = {}
authbroker.authenticate()(
    clientOk,
    'admin',
    'admin',
    (err, success) => {
        test(`authorizePublish is valid`, async (t) => {
            return new Promise((resolve) => {
                authbroker.authorizePublish()(clientOk, packet,
                    (e, s) => {
                        t.same(clientOk.claims.authorization.permissions[0].rsname, 'res:garden/fan', "topic is authorised")
                        t.same(s, null, "user is authorised")
                        resolve()
                    })
            })
        })
    })

var clientNotOk = {}
authbroker.authenticate()(
    clientNotOk,
    'analyst',
    'analyst',
    (err, success) => {
        test(`authorizePublish is not valid`, async (t) => {
            return new Promise((resolve) => {
                authbroker.authorizePublish()(clientNotOk, packet,
                    (e, s) => {
                        t.same(e.constructor, Error, "authorizePublish Error arised")
                        t.same(s, false, "user is Not authorised")
                        resolve()
                    })
            })
        })
    })