# Raspsolar

A server that waits for incoming solar panel data, parses it and sends the data to pvoutput.org

Tested with omnik 2000tl2 inverter and Growatt inverter GT0012F111 with WiFi module

## setup / configuration

- First copy the config example file: `cp .env.dist .env`
- edit `.env` file and fill in your pvoutput.org APIkey and SystemID values, along with your solar panel configuration (growatt, solaredge or omnik)

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

- `INSTALLATION_LABEL`: used as identifier in console logs and capture files
- `INSTALLATION_TYPE`: server or logger
- `PVOUTPUT_APIKEY`: apikey created on pvoutput.org
- `PVOUTPUT_SYSTEMID`: systemid of the installation on pvoutput.org
- `DATAPARSER`: can be either 'omnik' or 'growatt', depending on different kind of inverter data
- `PORT`: port on which to listen for data for this specific installation

## specific config file values for solaredge

- `DATAPARSER: 'solaredge'`
- `FREQUENCY: '*/5 * * * *'`: cron style frequency of how frequent to poll the api
- `SOLAREDGE_APIKEY: 'xxxx'`
- `SOLAREDGE_INSTALLATIONID: 'xxxx'`
