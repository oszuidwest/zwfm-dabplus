# ZuidWest DAB+

This project is designed to establish a DAB+ broadcasting system utilizing [Open Digital Radio tools](https://www.opendigitalradio.org). It focuses on setting up a DAB+ multiplex for West-Brabant in the Netherlands, which spans allotments 49 and 50.

**⚠️ This project is no longer under active development and has been shelved. The experimental features and code in this repository are highly insecure and should not be used in their current state. Further development and enhancements are necessary to ensure security and stability.**

## Architecture

The architecture is built around a dynamic system that auto-generates all required configurations from the editable `stations.json`.

- Internet streams of all included stations are transcoded using `ODR-AudioEnc`, and metadata is incorporated via `ODR-PadEnc`.
- A supervisory tool monitors these encoding operations.
- NodeJS scripts generate all necessary configuration files, such as `mux.json` for `ODR-DabMux`.
- Any modifications trigger the deployment of updated configuration files to the server, followed by a restart of the affected processes.
- If changes necessitate a multiplex rebuild, a complete restart of the multiplex is scheduled for 3 AM, because `ODR-DabMux` does not support live reloading.

## CI/CD

CI/CD pipelines are triggered by updates to `stations.json`. They oversee the setup, modification, or removal of ODR-AudioEnc encoders and the compilation of a new `mux.json` for ODR-DabMux. This process can also be initiated manually from the Actions tab on GitHub.

## Repository Contents

```
ZuidWest-DAB+/
│
├── .github/                   # GitHub specific files like workflows and actions
│   └── workflows/             # CI/CD workflows
│
├── config/                    # Configuration files
│   ├── dabmux.service         # Service file for the DAB multiplexer
│   ├── websocket.service      # Service file for the websocket that feeds the webinterface
│   └── mux.json               # Auto-generated multiplexer configuration
│
├── scripts/                   # Node helper scripts
│   ├── generator-dirs.js      # Node.js script to generate directories
│   ├── generator-encoders.js  # Node.js script for encoder configuration
│   └── generator-mux.js       # Node.js script for multiplexer configuration
│
├── web/                       # Highly insecure web interface (seriously, don't put this in production)
│   ├── index.html             # Status page for ODR-DabMux
│   ├── websocket.py           # Python script that converts the ZeroMQ output of ODR-DabMux to a websocket
│   └── setupweb.sh            # Set-up script for web interface
│
├── test/                      # Automated tests
│   └── validate-stations.js   # Validates the configuration in stations.json
│
├── stations.json              # User-edited station configuration (Edit this to get started)
├── setup.sh                   # Shell script for inital server setup
├── .gitignore                 # Specifies intentionally untracked files to ignore
└── README.md                  # Project overview and documentation
```
