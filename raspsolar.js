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
            const timestampNow = new Date()
            if (timestampNow - lastDataSent < (5 * 60000)) {
                console.log('skipping ' + installation.label + ' data sent to pvoutput (less than 5 minutes ago)');
            } else {
                lastDataSent = new Date();
                return parseAndSendData(data, new Date(), installation, pvoutputclient);
            }
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
