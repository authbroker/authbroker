var mqtt = require('mqtt')
  , host = 'localhost'
  , port = '1883'

var settings = {
  keepalive: 1000,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clientId: 'Reader-114',
  username:'ali',
  password:'king'
}

// client connection
var client = mqtt.createClient(port, host, settings)

//topic
client.subscribe('temperature')

client.on('message', function(topic, message) {

  if(topic ==='temperature')
  {
    console.log('New reading', message)
  }
})