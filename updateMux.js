const fs = require('fs');
const crypto = require('crypto');

// Define the paths to the JSON files
const stationsFilePath = './stations.json';
const muxFilePath = './mux.json';

// Function to generate a consistent ID from the abbreviation
function generateIdFromAbbreviation(abbreviation) {
    // Hash the abbreviation using SHA-256
    const hash = crypto.createHash('sha256').update(abbreviation).digest('hex');
    // Return the first 4 characters of the hash as the ID
    return '0x' + hash.substring(0, 4);
}

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

        // Clear all existing subchannels
        mux.subchannels = {};

        // Add each station as a service and a subchannel in the mux data
        stations.forEach(station => {
            const serviceName = `srv-${station.abbreviation}`;
            const serviceId = generateIdFromAbbreviation(station.abbreviation);

            mux.services[serviceName] = {
                id: serviceId,
                label: station.full_name
            };

            const subchannelName = `sub-${station.abbreviation}`;
            mux.subchannels[subchannelName] = {
                type: "dabplus",
                bitrate: station.bitrate,
                id: 69, // Assuming a static ID for now, might need dynamic generation
                protection: 1,
                inputproto: "edi",
                inputuri: `tcp://0.0.0.0:${station.port}`
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
