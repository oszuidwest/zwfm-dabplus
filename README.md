# ZuidWest DAB+
Thit is an experimental project with the Opendigitalradio tools to generate a DAB+ mux for Streekomroep ZuidWest.

## What's here?
- `setup.sh`: Creates a server with odr-audioenc, odr-padenc and odr-dabmux
- `stations.json`: Contains the stations in the mux
- `create_stations.sh`: Sets up encoders for the stations managed by Supervisor
- `updateMux.js`: Updates the `mux.json` file that will be loaded by odr-dabmux in the future
