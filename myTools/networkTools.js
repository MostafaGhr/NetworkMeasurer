// iperf header
const { exec } = require("child_process");
// end iperf header

// ping header
var ping = require("ping");
const fs = require("fs");
const { Parser } = require("json2csv");

let ping_res = {};
// end ping header

//trace header
const Traceroute = require("nodejs-traceroute");

trace_list = [];
//end trace header

function iperf_handler(iperf_server_address, iperf_port_address, callback) {
  let date_ob = Date();
  date_ob = date_ob.split(" ").join("_");
  date_ob = date_ob.replace("+", "_plus");
  date_ob = date_ob.replace("-", "_neg");
  date_ob = date_ob.replace("(", "");
  date_ob = date_ob.replace(")", "");
  // exec("mkdir " + iperf_path);

  // command to execute!
  let comm = "iperf3 -c " + iperf_server_address + " -p " + iperf_port_address + " -J";

  console.log(comm);

  exec(comm, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      console.log(stdout);
      console.log(stderr);
      return callback(err, null, stdout);
    } else {
      callback(null, date_ob, stdout);
    }
  });
}

function pingToLocalCSV(ipList, savePath) {
  ipList.forEach((ip) => {
    ping.promise
      .probe(ip, {
        packetSize: 70,
      })
      .then((res) => {
        if (ping_res[ip] == undefined) {
          ping_res[ip] = [];
        }
        let date_ob = Date();
        fs.access(savePath + ip + ".csv", fs.constants.F_OK | fs.constants.W_OK, (err) => {
          if (err) {
            const json2csvParser = new Parser({ header: true });
            csver = json2csvParser.parse({
              dest: ip,
              date: date_ob,
              rtt: res.time,
            });
            fs.writeFile(savePath + ip.toString() + ".csv", csver + "\n\r", (err) => {
              if (err) {
                console.log(err);
              }
            });
          } else {
            const json2csvParser = new Parser({ header: false });
            csver = json2csvParser.parse({
              dest: ip,
              date: date_ob,
              rtt: res.time,
            });
            fs.appendFile(savePath + ip.toString() + ".csv", csver + "\r\n", (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        });
      })
      .catch((e) => {
        console.log(e);
      });
  });
}

function pingPublish(ipList, packetSize, sourceAddr, callback) {
  ipList.forEach((ip) => {
    ping.promise
      .probe(ip, {
        packetSize: packetSize,
        sourceAddr: sourceAddr,
      })
      .then((res) => {
        let date_ob = Date();
        callback(null, ip, date_ob, res);
      })
      .catch((e) => {
        callback(e);
      });
  });
}

function tracer(destination, depth) {
  trace_list = [];
  i = 0;
  try {
    const tracer = new Traceroute();
    tracer
      .on("pid", (pid) => {
        // console.log(`pid: ${pid}`);
      })
      .on("destination", (destination) => {
        // console.log(`destination: ${destination}`);
      })
      .on("hop", (hop) => {
        if (i < depth) {
          i += 1;
          trace_list.push(hop.ip);
        }
        // console.log(`hop: ${JSON.stringify(hop)}`);
      })
      .on("close", (code) => {
        // console.log(`close: code ${code}`);
      });

    tracer.trace(destination);
  } catch (ex) {
    console.log(ex);
  }
}

module.exports = { iperf_handler, pingPublish, tracer };
