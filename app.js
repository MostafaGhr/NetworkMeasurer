const fs = require("fs");
let config = JSON.parse(fs.readFileSync("config.json"));

const networkTools = require("./myTools/networkTools");

networkTools.bootChecker();

// topics
settingTopic = "setting";
statusTopic = "status";
iperfTopic = "iperf";
pingTopic = "ping";

var mqtt = require("mqtt");
const { settings } = require("cluster");
var client = mqtt.connect("mqtt://" + config.brokerAdress, {
  will: { topic: statusTopic + "/" + config.clientID, payload: "off" },
});

// start default tasks
networkTools.tracer("google.com", 4);

pingTimers = [];

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
      doTrace(JSON.parse(message));
    }
    if (parsedTopic[1] == "startTest") {
      doIperf(JSON.parse(message));
    }
    if (parsedTopic[1] == "ping") {
      if (parsedTopic[2] == "start") {
        startPing(JSON.parse(message));
      }
      if (parsedTopic[2] == "stop") {
        stopPing();
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

function startPing(parsedMessage) {
  if (parsedMessage["src"] == "random") {
    sourceAddress =
      Math.floor(Math.random() * 255) +
      1 +
      "." +
      Math.floor(Math.random() * 255) +
      "." +
      Math.floor(Math.random() * 255) +
      "." +
      Math.floor(Math.random() * 255);
  } else if (parsedMessage["src"]) {
    sourceAddress = parsedMessage["src"];
  } else {
    sourceAddress = null;
  }
  if (parsedMessage["dest"]) {
    destAddress = [parsedMessage["dest"]];
  } else {
    destAddress = trace_list;
  }
  pingTimers.push(
    setInterval(() => {
      networkTools.pingPublish(destAddress, parsedMessage["load_size"], sourceAddress, (err, ip, date, res) => {
        if (err) {
          console.log(err);
        } else {
          client.publish(pingTopic + "/" + config.clientID, JSON.stringify({ ip: ip, date: date, time: res.time }));
        }
      });
    }, parsedMessage["interval"])
  );
}

function stopPing() {
  if (!pingTimers.length == 0 && pingTimers !== undefined) {
    pingTimers.forEach((timer) => {
      clearInterval(timer);
    });
    pingTimers = [];
  }
}

function doTrace(parsedMessage) {
  stopPing();
  networkTools.tracer(parsedMessage["dest"], parsedMessage["depth"]);
}

function doIperf(parsedMessage) {
  parsedMessage["option1"] ? (option1 = parsedMessage["option1"]) : (option1 = "");
  parsedMessage["option2"] ? (option2 = parsedMessage["option2"]) : (option2 = "");
  networkTools.iperf_handler(
    parsedMessage["server_ip"],
    parsedMessage["server_port"],
    option1,
    option2,
    (err, time, output) => {
      if (!err) {
        client.publish(iperfTopic + "/" + config.clientID + "/" + time, output);
      }
    }
  );
}
client.on("close", () => {
  client.publish(statusTopic + config.clientID, "off");
});
