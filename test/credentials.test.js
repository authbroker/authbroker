const authBroker = require("..")
const {
    test
} = require("tap")
let config = require("./config");
var client = {}

test(`Authentication username password validation`, async (t) => {
    const authbroker = new authBroker(config.keycloak)
    return new Promise((resolve) => {
        authbroker.authenticate()(
            client,
            'device',
            'device',
            (err, success) => {
                //console.log(success)
                t.same(client.claims.preferred_username, 'device', "username is same")
                t.same(success, true, "user is authenticated")
                resolve()
            }
        )
    })
})


test(`Authentication username password is NOT valid`, async (t) => {
    const authbroker = new authBroker(config.keycloak)
    return new Promise((resolve) => {
        authbroker.authenticate()(
            client,
            'device',
            'xdevicex',
            (err, success) => {
                t.same(success, false, "user is Not authenticated")
                t.same(err.constructor, Error, "subscription Error arised")
                resolve()
            }
        )
    })
})