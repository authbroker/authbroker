const aedes = require("aedes")({
    persistence: new require("aedes-persistence")()
});
const server = require("net").createServer(aedes.handle);
const port = 1883;

const Authorizer = require("../");

let config = require("../test/config");

const authorizer = new Authorizer(config.keycloak)

// hook it up
aedes.authenticate = authorizer.authenticate();
aedes.authorizeSubscribe = authorizer.authorizeSubscribe();
aedes.authorizePublish = authorizer.authorizePublish();

aedes.on('publish', async function (packet, client) {
    console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
})

aedes.on('subscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
        '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
        console.log(subscriptions[0])
})

server.listen(port, function () {
    console.log("server listening on port", port);
});