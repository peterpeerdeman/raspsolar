const rp = require('request-promise');
const querystring = require('querystring');
const moment = require('moment');

function pvoutput(settings) {

    const apiKey = settings.apiKey;
    const systemId = settings.systemId;

    /*
    Parameter   Field   Required    Format  Unit    Example Since   
    d   Date    Yes yyyymmdd    date    20100830    r1  
    t   Time    Yes hh:mm   time    14:12   r1  
    v1  Energy Generation   No1 number  watt hours  10000   r1  
    v2  Power Generation    No  number  watts   2000    r1  
    v3  Energy Consumption  No  number  watt hours  10000   r1  
    v4  Power Consumption   No  number  watts   2000    r1  
    v5  Temperature No  decimal celsius 23.4    r2  
    v6  Voltage No  decimal volts   210.7   r2  
    c1  Cumulative Flag No  number  -   1   r1  
    n   Net Flag    No  number  -   1   r2  
    delay   Net Delay   No  number  -   30  r2  DONATION MODE
    v7  Extended Value 1    No  number  User Defined    100.5   r2  DONATION MODE
    v8  Extended Value 2    No  number  User Defined    328 r2  DONATION MODE
    v9  Extended Value 3    No  number  User Defined    -291    r2  DONATION MODE
    v10 Extended Value 4    No  number  User Defined    29  r2  DONATION MODE
    v11 Extended Value 5    No  number  User Defined    192 r2  DONATION MODE
    v12 Extended Value 6    No  number  User Defined    9281.24 r2  DONATION MODE
    */
    this.addStatus = function(pvoutputdata) {

        var timestamp = moment(pvoutputdata.datetime);
        var date = timestamp.format('YYYYMMDD');
        var time = timestamp.format('HH:mm');

        var params = {
            key: apiKey,
            sid: systemId,
            d: date,
            t: time,
            v1: pvoutputdata.energyGeneration,
            v2: pvoutputdata.powerGeneration,
            v3: pvoutputdata.energyConsumption,
            v4: pvoutputdata.powerConsumption,
            v5: pvoutputdata.temperature,
            v6: pvoutputdata.voltage
        };

        var query = querystring.stringify(params);

        var url = 'http://pvoutput.org/service/r2/addstatus.jsp?' + query;

        return rp({
            uri: url,
        });
    }

    /*
     * Get status of PV installation
     *
     * Returns results:
     *
     * Date yyyymmdd    2016-06-1120100830
     * Time hh:mm   19:0714:10
     * Energy Generation    number  watt hours  12936
     * Power Generation number  watt    202
     * Energy Consumption   number  watt hours  19832
     * Power Consumption    number  watt    459
     * Efficiency   number  kWh/kW  5.280
     * Temperature  decimal celsius 15.3
     * Voltage  decimal volts   240.1
     */
    this.getStatus = function() {
        var params = {
            key: apiKey,
            sid: systemId,
        };

        var query = querystring.stringify(params);

        var url = 'http://pvoutput.org/service/r2/getstatus.jsp?' + query;

        return rp({
            uri: url,
            simple: false
        }).then(function(body) {
            var results = body.split(',');
            results = filterNanValues(results);

            return {
                date: moment(results[0]).toDate(),
                time: results[1],
                energyGeneration: parseInt(results[2]),
                powerGeneration: parseInt(results[3]),
                energyConsumption: parseInt(results[4]),
                powerConsumption: parseInt(results[5]),
                efficiency: parseFloat(results[6]),
                temperature: parseFloat(results[7]),
                voltage: parseFloat(results[8])
            };
        })
        .catch(function(err) {
            return err;
        });

    };

    /*
     * Get output of PV installation
     *
     * Returns results:
     *
     * Date yyyymmdd    2016-06-1120110327
     * Energy Generated number  watt hours  4413
     * Efficiency   number  kWh/kW  0.460
     * Energy Exported  number  watt hours  0
     * Energy Used  number  watt hours  21859
     * Peak Power   number  watts   2070
     * Peak Time    19:21hh:mm  11:00
     * Condition    -.textShowers
     * Min. Temperature number  degrees celsius -3
     * Max. Temperature number  degrees celsius 6
     * Peak Energy Import   number  watt hours  4220
     * Off-Peak Energy Import   number  watt hours  7308
     * Shoulder Energy Import   number  watt hours  2030
     * High-Shoulder Energy Import  number  watt hours  3888')
     */
    this.getOutput = function() {
        var params = {
            key: apiKey,
            sid: systemId,
        };

        var query = querystring.stringify(params);

        var url = 'http://pvoutput.org/service/r2/getoutput.jsp?' + query;

        return rp({
            uri: url,
            simple: false
        }).then(function(body) {
            var dayOutputs = body.split(';');
            return dayOutputs.map(function(day) {
                var dayValues = day.split(',');
                dayValues = filterNanValues(dayValues);
                return {
                    date: moment(dayValues[0]).toDate(),
                    energyGenerated: parseInt(dayValues[1]),
                    efficiency: parseFloat(dayValues[2]),
                    energyExported: parseInt(dayValues[3]),
                    energyUsed: parseInt(dayValues[4]),
                    peakPower: parseInt(dayValues[5]),
                    peakTime: dayValues[6],
                    condition: dayValues[7],
                    minTemperature: parseFloat(dayValues[8]),
                    maxTemperature: parseFloat(dayValues[9]),
                    peakEnergyImport: parseInt(dayValues[10]),
                    offPeakEnergyImport: parseInt(dayValues[11]),
                    shoulderEnergyImport: parseInt(dayValues[12]),
                    highShoulderEnergyImport: parseInt(dayValues[13]),
                };
            });

        })
        .catch(function(err) {
            return err;
        });

    };
}

function filterNanValues(results) {
    return results.map(function(result) {
        if (result === 'NaN') {
            return undefined;
        }
        return result;
    });
}

module.exports = pvoutput;
