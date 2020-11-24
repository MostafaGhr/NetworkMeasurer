const fs = require('fs');
let config = JSON.parse(fs.readFileSync('config.json'));

var mqtt = require('mqtt');
const networkTools = require('./myTools/networkTools');

var client = mqtt.connect('mqtt://' + config.brokerAdress)

// start default tasks
networkTools.tracer(config.traceDestination, config.traceDepth);

setInterval(() => {
  networkTools.pinger(trace_list, config.pingDirectory)
}, 1000);
// end start default tasks

client.on('connect', function () {
  client.subscribe(config.clientID + "/#", function (err) {
    if (!err) {
      console.log("subscribed to \"" + config.clientID + "/#\" successfully");
    }
  })
})

client.on('message', function (topic, message) {
  parsedTopic = topic.split("/")
  console.log(parsedTopic);

  console.log(topic.toString())
  console.log(message.toString())

  if (parsedTopic[1] == "traceReset") {
    networkTools.tracer(config.traceDestination, config.traceDepth);
  }
  if (parsedTopic[1] == "startTest") {
    networkTools.iperf_handler(config.iperfDirectory, config.iperfServerIP, config.iperfServerPort )
  }
  
})



