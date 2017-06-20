const net = require('net');
const fs = require('fs')

net.createServer(function (socket) {
    socket.on('data', function(data) {
        console.log(data.toString('utf8'));
        fs.appendFile(new Date().toString() + '.cap', data, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    });
}).listen(4000);

console.log('listening for data on port 4000');
