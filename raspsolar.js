const fs = require('fs');
const net = require('net');
const pvoutput = require('pvoutput');
const omnikDataParser = require('omnik-data-parser');
const growattDataParser = require('growatt-data-parser');
const CronJob = require('cron').CronJob;
const axios = require('axios').default;

const config = require('./config');

config.installations.forEach(function(installation) {
    const pvoutputclient = new pvoutput({
        debug: false,
        apiKey: installation.pvoutput_apikey,
        systemId: installation.pvoutput_systemid
    });

    if(installation.type == 'server') {
        createServer(installation, pvoutputclient);
    } else if (installation.type == 'logger') {
        createLogger(installation, pvoutputclient);
    }
});

function createServer(installation, pvoutputclient) {
    net.createServer(function (socket) {
        let lastDataSent = 0;
        socket.on('data', function(data) {
            console.log('incoming data for installation: ' + installation.label);
            if (installation.save_captures) {
                fs.appendFile(installation.label + ' - ' + new Date().toString() + '.cap', data, function (err) {
                    if (err) throw err;
                });
            } 
            if (installation.dataparser == 'growatt' && data.length == 18){
                //this is the client PING, we need to echo the server PING back
                console.log('sending ping');
                socket.write(data);
                return;
            } else if (installation.dataparser == 'growatt' && data.length == 223) {
                //this is the client announcement or valid datapack, we need to reply with ACK 03 packet
                console.log('sending ack to announcement');
                socket.write(Buffer.from('000100020003010300', 'hex'));
            } else if (installation.dataparser == 'growatt') {
                // this is a normal data packet, send ACK 04 packet back
                console.log('sending ack to data');
                socket.write(Buffer.from('000100020003010400', 'hex'));
            }

            // send received data to pvoutput, but skip if it was less than 5 min ago
            const timestampNow = new Date();
            if (timestampNow - lastDataSent < (5 * 60000)) {
                console.log('skipping ' + installation.label + ' data sent to pvoutput (less than 5 minutes ago)');
            } else {
                lastDataSent = new Date();
                return parseAndSendData(data, new Date(), installation, pvoutputclient);
            }
        });
    }).listen(installation.port);
    console.info(installation.label + ': listening for solar data on port: ' + installation.port);
}

function getSiteOverviewData(installation) {
    return axios.get(`https://monitoringapi.solaredge.com/site/${installation.solaredge_installationid}/overview?api_key=${installation.solaredge_apikey}`)
    .then(function (response) {
        // handle success
        return response.data.overview;
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    });
}

function createLogger(installation, pvoutputclient) {
    const cronJob = new CronJob({
        cronTime: installation.frequency,
        onTick: function() {
            getSiteOverviewData(installation)
            .then(function (data) {
                // handle success
                parseAndSendData(data, new Date(), installation, pvoutputclient);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            });
        },
        start: true,
        timeZone: 'Europe/Amsterdam'
    });
    cronJob.start();
    console.info(installation.label + ': logging solar data from: ' + installation.dataparser);
}

function solarEdgeParser(data) {
    return {
        etoday: data.lastDayData.energy/1000,
        pac1: data.currentPower.power,
        temperature: undefined,
        vac1: undefined
    };
}

function parseAndSendData(data, timestamp, installation, pvoutputclient) {
    try {
        var solardata;
        if (installation.dataparser == 'omnik') {
            solardata = omnikDataParser(data);
        } else if (installation.dataparser == 'growatt'){
            solardata = growattDataParser(data);
        } else if (installation.dataparser == 'solaredge') {
            solardata = solarEdgeParser(data);
        } else {
            throw new Error('dataparser was not defined');
        }

        return pvoutputclient.addStatus({
            datetime: timestamp,
            energyGeneration: solardata.etoday * 1000,
            powerGeneration: solardata.pac1,
            temperature: solardata.temperature,
            voltage: solardata.vac1

        }).then(function(result) {
            console.log(installation.label + ' - ' + new Date() + 'successfully sent result to pvoutput');
        }).catch(function(err) {
            console.log(installation.label + ' - '+ 'could not add pvoutput status' + err.message);
        });
    } catch (err) {
        console.log(installation.label + ' - '+ new Date() + 'could not parse data: ' + err);
        return;
    }
}
