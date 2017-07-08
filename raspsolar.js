const fs = require('fs');
const net = require('net');
const pvoutput = require('./pvoutput.js');
const omnikDataParser = require('omnik-data-parser');
const growattDataParser = require('growatt-data-parser');

const config = require('./config');

config.installations.forEach(function(installation) {
    const pvoutputclient = new pvoutput({
        debug: false,
        apiKey: installation.pvoutput_apikey,
        systemId: installation.pvoutput_systemid
    });

    net.createServer(function (socket) {
        socket.on('data', function(data) {
            console.log('incoming data for installation: ' + installation.label);
            if (installation.save_captures) {
                fs.appendFile(installation.label + ' - ' + new Date().toString() + '.cap', data, function (err) {
                    if (err) throw err;
                });
            }
            // send received data to pvoutput
            return parseAndSendData(data, new Date(), installation, pvoutputclient);
        });
    }).listen(installation.port);
    console.info(installation.label + ': listening for solar data on port: ' + installation.port);
});

function parseAndSendData(data, timestamp, installation, pvoutputclient) {
    try {
        var solardata;
        if (installation.dataparser == 'omnik') {
            solardata = omnikDataParser(data);
        } else if (installation.dataparser == 'growatt'){
            solardata = growattDataParser(data);
        } else {
            throw new Error('dataparser was not defined');
        }
    } catch (err) {
        console.log(installation.label + ' - '+ new Date() + 'could not parse omnik data: ' + err);
        return;
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
}
