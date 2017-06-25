# Raspomnik

A server that waits for incoming omnik solar panel data, parses it and sends the data to pvoutput.org

Tested with omnik 2000tl2 inverter

## usage

Commands:
  serve  listen for incoming omnik data and submit these to pvoutput
  parse  parse a captured omnik tcp message

Options:
  --help         Show help                                             [boolean]
  --verbose, -v                                                 [default: false]

## configuration

- `cp .env.dist .env`
- edit `.env` file and fill in your pvoutput.org APIkey and SystemID values

## example for server

`node raspomnik serve`

## example for server, capturing received tcp packets

` node raspomnik serve --save`

## example for parsing single capture file

`node raspomnik.js parse --file Fri\ Jun\ 23\ 2017\ 20:18:46\ GMT+0200\ \(CEST\).cap`
