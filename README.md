# ZuidWest DAB+

This project is an experiment to implement a DAB+ broadcasting workflow using Opendigitalradio tools, aimed at creating a DAB+ multiplex for Streekomroep ZuidWest (covering allotments 49 and 50 in the Netherlands).

## Architecture

The system automatically generates all necessary configurations from the editable `stations.json`.

- Internet streams for all included stations are transcoded using `ODR-AudioEnc`, with metadata added via `ODR-PadEnc`.
- A supervisor tool oversees these encoding processes.
- NodeJS scripts are used to produce all required configuration files, such as `mux.json` for `ODR-DabMux`.
- Whenever changes occur, the updated configuration files are deployed to the server and the affected processes are restarted.
- A full multiplex restart is scheduled at 3 AM to accommodate adjustments in the mux, due to `ODR-DabMux` lacking support for live reloading (Note: Implementation via cronjob or service is pending).

## CI/CD

Work in Progress

## Repository Contents

### Initial Setup Scripts in Bash
- `setup.sh`: Initializes a server equipped with odr-audioenc, odr-padenc, and odr-dabmux.
- `create_files.sh`: Generates dummy metadata and slideshow files (Note: Integration into a GitHub Action is planned).

### Configuration Generators in NodeJS
- `generator-dirs.js`: Generate a directory framework for the stations.
- `generator-encoders.js`: Generates encoder configuration files.
- `generator-mux.js`: Assembles the `mux.json` file to be utilized by `ODR-DabMux`.

### User-Defined Configuration
- `stations.json`: Lists the stations included in the multiplex.

### Automatically Generated Configurations
- `mux.json`: The multiplex configuration for ODR-DabMux, created by the generator.
