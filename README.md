# Raspsolar

A server that waits for incoming solar panel data, parses it and sends the data to pvoutput.org

Tested with omnik 2000tl2 inverter and Growatt inverter GT0012F111 with WiFi module

## setup / configuration

- First copy the config example file: `cp config.js.dist config.js`
- edit `config.js` file and fill in your pvoutput.org APIkey and SystemID values, along with your solar panel configuration (growatt, solaredge or omnik)

## usage

```bash
npm install
node raspsolar.js
```

## usage with docker

```bash
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:13-buster npm install
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app -p 5279:5279 node:13-buster node raspsolar.js
```

## config file values per installation

- `label`: used as identifier in console logs and capture files
- `pvoutput_apikey`: apikey created on pvoutput.org
- `pvoutput_systemid`: systemid of the installation on pvoutput.org
- `dataparser`: can be either 'omnik' or 'growatt', depending on different kind of inverter data
- `port`: port on which to listen for data for this specific installation
- `save_captures`: whether or not to save the incoming data as raw capture files (either true or false)

## specific config file values for solaredge

- `dataparser: 'solaredge'`
- `frequency: '*/5 * * * *'`: cron style frequency of how frequent to poll the api
- `solaredge_apikey: 'xxxx'`
- `solaredge_installationid: 'xxxx'`
