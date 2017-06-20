const fs = require('fs');

const Parser = require('binary-parser').Parser;

fs.readFile('test.cap', function(err, data) {
    console.log(data.length);
    
    if (data.length < 143) {
        // data too short
        return;
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
        .string('temperature', {
            encoding: 'hex',
            length: 2
        })
        .string('vpv1', {
            encoding: 'hex',
            length: 2 
        })
        .string('vpv2', {
            encoding: 'hex',
            length: 2 
        })
        .string('vpv3', {
            encoding: 'hex',
            length: 2 
        })
        .string('ipv1', {
            encoding: 'hex',
            length: 2 
        })
        .string('ipv2', {
            encoding: 'hex',
            length: 2 
        })
        .string('ipv3', {
            encoding: 'hex',
            length: 2 
        })
        .string('iac1', {
            encoding: 'hex',
            length: 2 
        })
        .string('iac2', {
            encoding: 'hex',
            length: 2 
        })
        .string('iac3', {
            encoding: 'hex',
            length: 2 
        })
        .string('vac1', {
            encoding: 'hex',
            length: 2 
        })
        .string('vac2', {
            encoding: 'hex',
            length: 2 
        })
        .string('vac3', {
            encoding: 'hex',
            length: 2 
        })
        .string('fac1', {
            encoding: 'hex',
            length: 2 
        })
        .string('pac1', {
            encoding: 'hex',
            length: 2 
        })
        .string('fac2', {
            encoding: 'hex',
            length: 2 
        })
        .string('pac2', {
            encoding: 'hex',
            length: 2 
        })
        .string('fac3', {
            encoding: 'hex',
            length: 2 
        })
        .string('pac3', {
            encoding: 'hex',
            length: 2 
        })
        .string('etoday', {
            encoding: 'hex',
            length: 2 
        })
        .string('etotal', {
            encoding: 'hex',
            length: 4 
        })
        .string('htotal', {
            encoding: 'hex',
            length: 4 
        })

    console.log(omnikSolarByteData.parse(data, 'hex'));
    
});
