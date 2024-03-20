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

        // Clear existing services, subchannels, and components
        mux.services = {};
        mux.subchannels = {};
        mux.components = {};

        // Add each station as a service, subchannel, and component in the mux data
        stations.forEach((station, index) => {
            const serviceName = `srv-${station.abbreviation}`;
            const serviceId = generateIdFromAbbreviation(station.abbreviation);

            mux.services[serviceName] = {
                id: serviceId,
                label: station.full_name
            };

            const subchannelName = `sub-${station.abbreviation}`;
            // Calculate ID based on the station's position in the array, starting from 1
            const subchannelId = index + 1;
            mux.subchannels[subchannelName] = {
                type: "dabplus",
                bitrate: station.bitrate,
                id: subchannelId,
                protection: 3, // Level 1 represents the strongest and Level 4 the lowest error protection, the most used is 3
                inputproto: "edi",
                inputuri: `tcp://0.0.0.0:${station.port}`
            };

            const componentId = `comp-${station.abbreviation}`;
            // Add the component for the station
            mux.components[componentId] = {
                service: serviceName,
                subchannel: subchannelName
            };

            // Only add the user-applications if slideshow is enabled
            if (station.slideshow === "yes") {
                mux.components[componentId]["user-applications"] = {
                    userapp: "slideshow"
                };
            }
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
