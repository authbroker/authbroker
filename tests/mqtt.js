/*******************************************************************************
 * this test inspired by Ponte project, a work by Matteo Collina
 *    Matteo Collina - https://github.com/eclipse/ponte
 * Before runing this test, you should run Mongodb server in localhost and ../example/insertDemoDB.js
 *******************************************************************************/

var request = require('supertest')
var mqtt = require('mqtt')
var ponte = require('ponte')
var authBroker = require('../lib/index')
var expect = require('expect.js')

describe('Test against MQTT server', function () {
    var settings
    var instance

    before(function (done) {
        require('../example/demoDB')
        done()
    })

    beforeEach(function (done) {
        var envAuth = {
            db: {
                type: 'mongo',
                url: 'mongodb://localhost:27017/paraffin',
                collectionName: 'authBroker',
                methodology: 'vertical',
                option: {}
            },
            salt: {
                salt: 'salt', //salt by pbkdf2 method
                digest: 'sha512',
                // size of the generated hash
                hashBytes: 64,
                // larger salt means hashed passwords are more resistant to rainbow table, but
                // you get diminishing returns pretty fast
                saltBytes: 16,
                // more iterations means an attacker has to take longer to brute force an
                // individual password, so larger is better. however, larger also means longer
                // to hash the password. tune so that hashing the password takes about a
                // second
                iterations: 10
            },
            wildCard: {
                wildcardOne: '+',
                wildcardSome: '#',
                separator: '/'
            },
            adapters: {
                mqtt: {
                    limitW: 50,
                    limitMPM: 10
                },
                http: {},
                coap: {}
            }
        }

        var auth = new authBroker(envAuth)

        settings = {
            logger: {
                level: 'info',
                name: 'ParaffinIoT'
            },
            http: {
                port: 3000,
                authenticate: auth.authenticateHTTP(),
                authorizeGet: auth.authorizeGetHTTP(),
                authorizePut: auth.authorizePutHTTP()
            },
            mqtt: {
                port: 1883, // tcp
                authenticate: auth.authenticateMQTT(),
                authorizePublish: auth.authorizePublishMQTT(),
                authorizeSubscribe: auth.authorizeSubscribeMQTT()
            },
            coap: {
                port: 2345, // udp
                authenticate: auth.authenticateHTTP(),
                authorizeGet: auth.authorizeGetHTTP(),
                authorizePut: auth.authorizePutHTTP()
            },
            persistence: {
                // same as http://mcollina.github.io/mosca/docs/lib/persistence/mongo.js.html
                type: 'mongo',
                url: 'mongodb://localhost:27017/ponte'
            },
            broker: {
                // same as https://github.com/mcollina/ascoltatori#mongodb
                type: 'mongo',
                url: 'mongodb://localhost:27017/ponte'
            }
        }
        //settings = ponteSettings()
        instance = ponte(settings, done)
    })

    afterEach(function (done) {
        instance.close(done)
    })


    function connect(options) {
        return mqtt.connect('mqtt://localhost', options)
    }

    it('should allow a client to publish and subscribe with allowed topics', function(done) {
        let options = {
            port: settings.mqtt.port,
            clientId: "0050bdee-dd8b-43a3-8602-a10f1d0e2659",
            username: "ali",
            password: "amiralmomenin",
            clean: true,
            protocolId: 'MQIsdp',
            protocolVersion: 3
        }
        let client = connect(options)
        client
            .subscribe('mahdi/hello')
            .publish('mahdi/hello', 'world')
            .on('message', function (topic, payload) {
                console.log(topic + ' ; ' + payload)
                expect(topic).to.eql('mahdi/hello')
                expect(payload.toString()).to.eql('world')
                done()
            })
    })


    it('should expose retained messages to HTTP with pbkdf2 salted password', function (done) {
        let option = {
            port: settings.mqtt.port,
            clientId: "0186c5f8-0aad-4912-b5f2-d93ae4ef1f78",
            username: "mohammad",
            password: "adrekni",
            clean: true,
            protocolId: 'MQIsdp',
            protocolVersion: 3
        }

        let client = connect(option)
        client
            .publish('daniel/home/hall/lamp', 'lamp is ON', { retain: true, qos: 1 }, function () {
                request(instance.http.server)
                    .get('/resources/daniel/home/hall/lamp')
                    .auth('mohammad', 'adrekni')
                    .set('x-client-id', '0186c5f8-0aad-4912-b5f2-d93ae4ef1f78')
                    .expect(200, 'lamp is ON', done)
            })
    })


    it('should support wildcards', function (done) {
        let option = {
            port: settings.mqtt.port,
            clientId: "0050bdee-dd8b-43a3-8602-a10f1d0e2659",
            username: "mahdi",
            password: "adrekni",
            clean: true,
            protocolId: 'MQIsdp',
            protocolVersion: 3
        }
        var client = connect(option)
        client
            .subscribe('mahdi/#')
            .publish('mahdi/garden', 'hello')
            .on('message', function (topic, payload) {
                expect(topic).to.eql('mahdi/garden')
                expect(payload.toString()).to.eql('hello')
                done()
            })
    })


    it('should throw a connection error if there is an unauthorized', function (done) {
        var client = mqtt.connect('mqtt://localhost:' + settings.mqtt.port, {
            clientId: "logger",
            username: 'hasan',
            password: 'baqi'
        })
        client.on('connect', function () {
            client.end()
            done(new Error('Expected connection error'))
        })
        client.on('error', function (error) {
            client.end()
            expect(error.message).to.eql('Connection refused: Not authorized')
            done()
        })
    })


    it('should close the connection if an unauthorized publish is attempted', function (done) {
        var client = mqtt.connect('mqtt://localhost:' + settings.mqtt.port, {
            clientId: "lamp110",
            username: 'hosein',
            password: 'sarallah'
        })
        var error
        client.on('message', function () {
            error = new Error('Expected connection close')
            client.end()
        })
        var closeListener = function () {
            client.removeListener('close', closeListener)
            if (error) {
                console.log(error)
                done(error)
            } else {
                client.end()
                done()
            }
        }
        client.on('close', closeListener)
        client.subscribe('unauthorizedPublish')
            .publish('unauthorizedPublish', 'world')
    })


    it('should denny the subscription when an unauthorized subscribe is attempted', function (done) {
        var client = mqtt.connect('mqtt://localhost:' + settings.mqtt.port, {
            clientId: "lamp110",
            username: 'hosein',
            password: 'sarallah'
        })
        client.subscribe('unauthorizedSubscribe', function (err, subscribes) {
            if (err) throw (err)
            client.end()
            expect(subscribes[0].qos).to.eql(0x80)
            done()
        })
    })


})