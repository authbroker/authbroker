var mqtt = require('mqtt')
  , host = 'localhost'
  , port = '1883'

var settings = {
  keepalive: 1000,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clientId: 'Thermostat1398', //This is registered bi lib/insertDemoDB.js
  username:'ali',
  password: 'fatima'
}

// client connection
var mqttClient = mqtt.createClient(port, host, settings)

setInterval(sendTemperature, 2000, mqttClient)

function sendTemperature(client){	

  console.log("Sending event")

	var t = {
		T: Math.random() * 100,
		Units: "C"
	}

  //publish on the "temperature" topic
	client.publish('temperature', JSON.stringify(t))
}
