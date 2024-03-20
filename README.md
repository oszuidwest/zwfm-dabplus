# ZuidWest DAB+

This project aims to implement a DAB+ broadcasting workflow using [Open Digital Radio tools](https://www.opendigitalradio.org), aimed at creating a DAB+ multiplex for Streekomroep ZuidWest (covering allotments 49 and 50 in the Netherlands).

## Architecture

The system automatically generates all necessary configurations from the editable `stations.json`.

- Internet streams for all included stations are transcoded using `ODR-AudioEnc`, with metadata added via `ODR-PadEnc`.
- A supervisor tool oversees these encoding processes.
- NodeJS scripts are used to produce all required configuration files, such as `mux.json` for `ODR-DabMux`.
- Whenever changes occur, the updated configuration files are deployed to the server and the affected processes are restarted.
- A full multiplex restart is scheduled at 3 AM to accommodate adjustments in the mux, due to `ODR-DabMux` lacking support for live reloading.

## CI/CD

Work in Progress

## Repository Contents

```
ZuidWest-DAB+/
│
├── .github/                   # GitHub specific files like workflows and actions
│   └── workflows/             # CI/CD workflows
│
├── config/                    # Configuration files
│   ├── dabmux.service         # Service file for the DAB multiplexer
│   └── mux.json               # Auto-generated multiplexer configuration
│
├── scripts/                   # Node helper scripts
│   ├── generator-dirs.js      # Node.js script to generate directories
│   ├── generator-encoders.js  # Node.js script for encoder configuration
│   └── generator-mux.js       # Node.js script for multiplexer configuration
│
├── test/                      # Automated tests
│   └── validate-stations.js   # Validates the configuration in stations.json
│
├── stations.json              # User-edited station configuration (Edit this to get started)
├── setup.sh                   # Shell script for inital server setup
├── .gitignore                 # Specifies intentionally untracked files to ignore
└── README.md                  # Project overview and documentation
```
