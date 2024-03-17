const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Define the paths to your JSON files
const stationsFilePath = './stations.json';
const muxFilePath = './mux.json';

// Read and parse the stations JSON data
fs.readFile(stationsFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading ${stationsFilePath}:`, err);
        return;
    }

    const stations = JSON.parse(data).stations;

    // Read and parse the mux JSON data
    fs.readFile(muxFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading ${muxFilePath}:`, err);
            return;
        }

        const mux = JSON.parse(data);

        // Remove all existing services
        mux.services = {};

        // Add each station as a service in the mux data
        stations.forEach(station => {
            const serviceId = '0x' + uuidv4().slice(0, 4);
            const serviceName = `srv-${station.abbreviation}`;

            mux.services[serviceName] = {
                id: serviceId,
                label: station.full_name
            };
        });

        // Write the updated mux data back to the mux.json file
        fs.writeFile(muxFilePath, JSON.stringify(mux, null, 4), (err) => {
            if (err) {
                console.error(`Error writing to ${muxFilePath}:`, err);
                return;
            }
            console.log('Mux file updated successfully.');
        });
    });
});
