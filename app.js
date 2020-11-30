const { json } = require("express");
const fs = require("fs");
let config = JSON.parse(fs.readFileSync("config.json"));

var mqtt = require("mqtt");
const { pingPublish } = require("./myTools/networkTools");
const networkTools = require("./myTools/networkTools");

// topics
settingTopic = "setting";
statusTopic = "status";
iperfTopic = "iperf";
pingTopic = "ping";

var client = mqtt.connect("mqtt://" + config.brokerAdress, {
  will: { topic: statusTopic + "/" + config.clientID, payload: "off" },
});

// start default tasks
networkTools.tracer(config.traceDestination, config.traceDepth);

payloadSize = config.pingPayloadSize;
sourceAddress = config.pingSourceAddress;

pingInterval = setInterval(() => {
  if (config.pingSourceAddress == "random") {
    sourceAddress =
      Math.floor(Math.random() * 255) +
      1 +
      "." +
      Math.floor(Math.random() * 255) +
      "." +
      Math.floor(Math.random() * 255) +
      "." +
      Math.floor(Math.random() * 255);
  }
  networkTools.pingPublish(trace_list, payloadSize, sourceAddress, (err, ip, date, res) => {
    if (err) {
      console.log(err);
    } else {
      client.publish(pingTopic + "/" + config.clientID, JSON.stringify({ ip: ip, date: date, time: res.time }));
    }
  });
}, config.pingInterval);

// end start default tasks

client.on("connect", function () {
  client.publish(statusTopic + "/" + config.clientID, "on");
  client.subscribe(config.clientID + "/#", function (err) {
    if (!err) {
      console.log('subscribed to "' + config.clientID + '/#" successfully');
    }
  });
  client.subscribe(statusTopic, function (err) {
    if (!err) {
      console.log('subscribed to "' + statusTopic + '/#" successfully');
    }
  });
});

client.on("message", function (topic, message) {
  parsedTopic = topic.split("/");
  console.log(parsedTopic);

  // console.log(topic.toString());
  // console.log(message.toString());

  if (parsedTopic[0] == config.clientID) {
    if (parsedTopic[1] == "traceReset") {
      networkTools.tracer(config.traceDestination, config.traceDepth, (err, ip, res) => {
        if (!err) {
          client.publish(iperfTopic + "/" + config.clientID + "/" + time, output);
        }
      });
    }
    if (parsedTopic[1] == "startTest") {
      networkTools.iperf_handler(config.iperfServerIP, config.iperfServerPort, (err, time, output) => {
        if (!err) {
          client.publish(iperfTopic + "/" + config.clientID + "/" + time, output);
        }
      });
    }
    if (parsedTopic[1] == "ping") {
      if (message.toString() == "on") {
        if (!pingInterval) {
          pingInterval = setInterval(() => {
            if (config.pingSourceAddress == "random") {
              sourceAddress =
                Math.floor(Math.random() * 255) +
                1 +
                "." +
                Math.floor(Math.random() * 255) +
                "." +
                Math.floor(Math.random() * 255) +
                "." +
                Math.floor(Math.random() * 255);
            }
            networkTools.pingPublish(trace_list, payloadSize, sourceAddress, (err, ip, date, res) => {
              if (err) {
                console.log(err);
              } else {
                client.publish(
                  pingTopic + "/" + config.clientID,
                  JSON.stringify({ ip: ip, date: date, time: res.time })
                );
              }
            });
          }, config.pingInterval);
        }
      }
      if (message.toString() == "off") {
        clearInterval(pingInterval);
        pingInterval = false;
      }
    }
    if (parsedTopic[1] == settingTopic) {
      settingJson = JSON.parse(message.toString());
      for (var attr in settingJson) {
        config[attr] = settingJson[attr];
      }
      fs.writeFile("config.json", JSON.stringify(config), (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }

  if (parsedTopic[0] == statusTopic) {
    client.publish(statusTopic + "/" + config.clientID, "on", (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
});

client.on("close", () => {
  client.publish(statusTopic + config.clientID, "off");
});
