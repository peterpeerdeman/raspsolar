require("dotenv").config();

const net = require("net");
const pvoutput = require("pvoutput");
const omnikDataParser = require("omnik-data-parser");
const growattDataParser = require("growatt-data-parser");
const CronJob = require("cron").CronJob;
const axios = require("axios").default;

const pvoutputclient = new pvoutput({
  apiKey: process.env.PVOUTPUT_APIKEY,
  systemId: process.env.PVOUTPUT_SYSTEMID,
});

if (process.env.INSTALLATION_TYPE == "server") {
  createServer(pvoutputclient);
} else if (process.env.INSTALLATION_TYPE == "logger") {
  createLogger(pvoutputclient);
}

function createServer(pvoutputclient) {
  net
    .createServer(function (socket) {
      let lastDataSent = 0;
      socket.on("data", function (data) {
        console.log(
          "incoming data for installation: " + process.env.INSTALLATION_LABEL
        );
        if (process.env.DATAPARSER == "growatt" && data.length == 18) {
          //this is the client PING, we need to echo the server PING back
          console.log("sending ping");
          socket.write(data);
          return;
        } else if (process.env.DATAPARSER == "growatt" && data.length == 223) {
          //this is the client announcement or valid datapack, we need to reply with ACK 03 packet
          console.log("sending ack to announcement");
          socket.write(Buffer.from("000100020003010300", "hex"));
        } else if (process.env.DATAPARSER == "growatt") {
          // this is a normal data packet, send ACK 04 packet back
          console.log("sending ack to data");
          socket.write(Buffer.from("000100020003010400", "hex"));
        }

        // send received data to pvoutput, but skip if it was less than 5 min ago
        const timestampNow = new Date();
        if (timestampNow - lastDataSent < 5 * 60000) {
          console.log(
            "skipping " +
              process.env.INSTALLATION_LABEL +
              " data sent to pvoutput (less than 5 minutes ago)"
          );
        } else {
          lastDataSent = new Date();
          return parseAndSendData(data, new Date(), pvoutputclient);
        }
      });
    })
    .listen(process.env.PORT || 5279);
  console.info(`${process.env.INSTALLATION_LABEL}: listening for solar data`);
}

function getSiteOverviewData() {
  return axios
    .get(
      `https://monitoringapi.solaredge.com/site/${process.env.SOLAREDGE_INSTALLATIONID}/overview?api_key=${process.env.SOLAREDGE_APIKEY}`
    )
    .then(function (response) {
      // handle success
      return response.data.overview;
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
}

function createLogger(pvoutputclient) {
  const cronJob = new CronJob({
    cronTime: process.env.FREQUENCY,
    onTick: function () {
      getSiteOverviewData()
        .then(function (data) {
          // handle success
          parseAndSendData(data, new Date(), pvoutputclient);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    },
    start: true,
    timeZone: process.env.TIMEZONE || "Europe/Amsterdam",
  });
  cronJob.start();
  console.info(
    `${process.env.INSTALLATION_LABEL}: logging solar data from: ${process.env.DATAPARSER}`
  );
}

function solarEdgeParser(data) {
  return {
    etoday: data.lastDayData.energy / 1000,
    pac1: data.currentPower.power,
    temperature: undefined,
    vac1: undefined,
  };
}

function parseAndSendData(data, timestamp, pvoutputclient) {
  try {
    var solardata;
    if (process.env.DATAPARSER == "omnik") {
      solardata = omnikDataParser(data);
    } else if (process.env.DATAPARSER == "growatt") {
      solardata = growattDataParser(data);
    } else if (process.env.DATAPARSER == "solaredge") {
      solardata = solarEdgeParser(data);
    } else {
      throw new Error("dataparser was not defined");
    }

    return pvoutputclient
      .addStatus({
        datetime: timestamp,
        energyGeneration: solardata.etoday * 1000,
        powerGeneration: solardata.pac1,
        temperature: solardata.temperature,
        voltage: solardata.vac1,
      })
      .then(function (result) {
        console.log(
          `${
            process.env.INSTALLATION_LABEL
          } - ${new Date()} successfully sent result to pvoutput`
        );
      })
      .catch(function (err) {
        console.log(
          `${
            process.env.INSTALLATION_LABEL
          } - ${new Date()} could not add pvoutput status ${err.message}`
        );
      });
  } catch (err) {
    console.log(
      `${process.env.INSTALLATION_LABEL} - ${new Date()} could not parse data ${
        err.message
      }`
    );
    return;
  }
}
