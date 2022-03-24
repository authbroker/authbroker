const authBroker = require("..")
const {
    test
} = require("tap")
let config = require("./config");
var subscription = {
    topic: 'garden/fan'
}

const authbroker = new authBroker(config.keycloak)

var clientOk = {}
authbroker.authenticate()(
    clientOk,
    'admin',
    'admin',
    (err, success) => {
        test(`authorizeSubscribe is valid`, async (t) => {
            return new Promise((resolve) => {
                authbroker.authorizeSubscribe()(clientOk, subscription,
                    (e, s) => {
                        t.same(clientOk.claims.authorization.permissions[0].rsname, 'res:garden/fan', "topic is authorised")
                        t.same(e, null, "error for subscription is clear")
                        t.same(s.topic, "garden/fan", "sub object is found")
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
        test(`authorizeSubscribe is not valid`, async (t) => {
            return new Promise((resolve) => {
                authbroker.authorizeSubscribe()(clientNotOk, subscription,
                    (e, s) => {
                        t.same(e.constructor, Error, "subscription Error arised")
                        t.same(s, null, "subscription is null")
                        resolve()
                    })
            })
        })
    })