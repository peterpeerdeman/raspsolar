# Raspsolar

A server that waits for incoming solar panel data, parses it and sends the data to pvoutput.org

Tested with omnik 2000tl2 inverter and Growatt inverter GT0012F111 with WiFi module

## usage

`node raspsolar.js`

## configuration

- `cp config.js.dist config.js`
- edit `config.js` file and fill in your pvoutput.org APIkey and SystemID values

## config file values per installation

- `label`: used as identifier in console logs and capture files
- `pvoutput_apikey`: apikey created on pvoutput.org
- `pvoutput_systemid`: systemid of the installation on pvoutput.org
- `dataparser`: can be either 'omnik' or 'growatt', depending on different kind of inverter data
- `port`: port on which to listen for data for this specific installation
- `save_captures`: whether or not to save the incoming data as raw capture files (either true or false)
