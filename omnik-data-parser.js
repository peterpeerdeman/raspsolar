const Parser = require('binary-parser').Parser;

function divideBy10(data) {
    return data/10;
}

function divideBy100(data) {
    return data/100;
}

function parseOmnikData(data) {

    if (data.length < 143) {
        throw new Error('omnik data is too short');
        return undefined;
    }

    const omnikSolarByteData = new Parser()
        .string('header', {
            encoding: 'hex',
            length: 4,
        })
        .string('unknown', {
            encoding: 'hex',
            length: 11,
        })
        .string('serialnumber', {
            length: 16
        })
        .uint16('temperature', {
            formatter: divideBy10
        })
        .uint16('vpv1', {
            formatter: divideBy10
        })
        .uint16('vpv2', {
            formatter: divideBy10
        })
        .uint16('vpv3', {
            formatter: divideBy10
        })
        .uint16('ipv1', {
            formatter: divideBy10
        })
        .uint16('ipv2', {
            formatter: divideBy10
        })
        .uint16('ipv3', {
            formatter: divideBy10
        })
        .uint16('iac1', {
            formatter: divideBy10
        })
        .uint16('iac2', {
            formatter: divideBy10
        })
        .uint16('iac3', {
            formatter: divideBy10
        })
        .uint16('vac1', {
            formatter: divideBy10
        })
        .uint16('vac2', {
            formatter: divideBy10
        })
        .uint16('vac3', {
            formatter: divideBy10
        })
        .uint16('fac1', {
            formatter: divideBy100
        })
        .uint16('pac1')
        .uint16('fac2', {
            formatter: divideBy100
        })
        .uint16('pac2')
        .uint16('fac3', {
            formatter: divideBy100
        })
        .uint16('pac3')
        .uint16('etoday', {
            formatter: divideBy100
        })
        .uint32('etotal', {
            formatter: divideBy10
        })
        .uint32('htotal');

    return omnikSolarByteData.parse(data, 'hex');
}

module.exports = parseOmnikData;
