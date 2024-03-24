// This file creates the a ODR-DabMux compatible configration file for each mux

const fs = require("fs");
const crypto = require("crypto");

// Define the path to the stations JSON file
const stationsFilePath = "./stations.json";

// Function to generate a consistent ID from the abbreviation
function generateIdFromAbbreviation(abbreviation) {
  const hash = crypto.createHash("sha256").update(abbreviation.toLowerCase()).digest("hex");
  return `0x${hash.substring(0, 4)}`;
}

// Read and parse the stations JSON data
fs.readFile(stationsFilePath, "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading ${stationsFilePath}:`, err);
    process.exit(1);
  }

  const { stations } = JSON.parse(data);

  // Group stations by multiplex, skipping those not in a multiplex
  const muxGroups = {};
  stations.forEach(station => {
    if (!station.multiplex) return;

    const multiplexes = Array.isArray(station.multiplex) ? station.multiplex : [station.multiplex];
    multiplexes.forEach(mux => {
      if (!muxGroups[mux]) {
        muxGroups[mux] = [];
      }
      muxGroups[mux].push(station);
    });
  });

  // Generate a JSON file for each multiplex
  Object.keys(muxGroups).forEach(muxNumber => {
    const muxFile = `./config/mux_${muxNumber}.json`;
    const muxData = { services: {}, subchannels: {}, components: {} };

    muxGroups[muxNumber].forEach((station, index) => {
      const { abbreviation } = station;
      const serviceName = `srv-${abbreviation.toLowerCase()}`;
      const serviceId = generateIdFromAbbreviation(abbreviation);

      muxData.services[serviceName] = {
        id: serviceId,
        label: station.full_name,
        shortlabel: abbreviation,
      };

      const subchannelName = `sub-${abbreviation.toLowerCase()}`;
      const subchannelId = index + 1;
      muxData.subchannels[subchannelName] = {
        type: "dabplus",
        bitrate: station.bitrate,
        id: subchannelId,
        protection: 3, // Level 1 is strongest and 4 the lowest error protection, most used is 3
        inputproto: "edi",
        inputuri: `tcp://0.0.0.0:${station.port}`,
      };

      const componentId = `comp-${abbreviation.toLowerCase()}`;
      muxData.components[componentId] = {
        service: serviceName,
        subchannel: subchannelName,
      };

      if (station.slideshow) {
        muxData.components[componentId]["user-applications"] = {
          userapp: "slideshow",
        };
      }
    });

    fs.writeFile(muxFile, JSON.stringify(muxData, null, 4), (writeErr) => {
      if (writeErr) {
        console.error(`Error writing to ${muxFile}:`, writeErr);
        process.exit(1);
      }
      console.log(`Mux file ${muxFile} updated successfully.`);
    });
  });
});
