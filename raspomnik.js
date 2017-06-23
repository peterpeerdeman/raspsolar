require('dotenv').config();
const fs = require('fs');
const net = require('net');
const pvoutput = require('./pvoutput.js');
const omnikDataParser = require('./omnik-data-parser.js');

const pvoutputclient = new pvoutput({
    debug: false,
    apiKey: process.env.PVOUTPUT_APIKEY,
    systemId: process.env.PVOUTPUT_SYSTEMID
});    

const yargs = require('yargs')
    .command('serve', 'listen for incoming omnik data and submit these to pvoutput', (yargs) => {
        yargs.option('port', {
            describe: 'port to bind on',
            default: 4000
        });
        yargs.option('save', {
            describe: 'save captures to file',
            default: false
        });
    }, (argv) => {
        net.createServer(function (socket) {
            socket.on('data', function(data) {
                console.log(data.toString('utf8'));
                if (argv.save) {
                    fs.appendFile(new Date().toString() + '.cap', data, function (err) {
                        if (err) throw err;
                        console.log('Saved!');
                    });
                }

                // send received data to pvoutput
                return parseAndSendData(data, new Date());
            });
        }).listen(argv.port);

        console.info('listening for omnik data on port: ' + argv.port);
    })
    .command('parse', 'parse a captured omnik tcp message', (yargs) => {
        yargs.demandOption('file', {
            describe: 'capture file that needs to be parsed parse',
        });
    }, (argv) => {
        const filename = argv.file;

        fs.readFile(filename, function(err, data) {
            const timestamp = new Date(filename.split('.')[0]);
            if (!timestamp) {
                throw new Error('could not parse timestamp in filename');
            }
            return parseAndSendData(data, timestamp);
        });
    })
    .demandCommand(1, 'please use command serve or parse')
    .option('verbose', {
        alias: 'v',
        default: false
    })
    .help()
    .argv;

function parseAndSendData(data, timestamp) {
    try {
        const solardata = omnikDataParser(data);
    } catch (err) {
        console.log(new Date() + 'could not parse omnik data');
        return;
    }


    console.log(solardata);
    return;
    return pvoutputclient.addStatus({
        datetime: timestamp,
        energyGeneration: solardata.etoday * 1000,
        powerGeneration: solardata.pac1,
        temperature: solardata.temperature,
        voltage: solardata.vac1

    }).then(function(result) {
        console.log(new Date() + 'successfully sent result to pvoutput');
    }).catch(function(err) {
        console.log('could not add pvoutput status' + err.message);
    });
}
