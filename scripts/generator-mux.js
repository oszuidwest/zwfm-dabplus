// This file creates the mux.json file for ODR-DabMux
const fs = require("fs");
const crypto = require("crypto");

// Define the paths to the JSON files
const stationsFilePath = "./stations.json";
const muxFilePath = "./config/mux.json";

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

  // Read and parse the mux JSON data
  fs.readFile(muxFilePath, "utf8", (muxErr, muxData) => {
    if (muxErr) {
      console.error(`Error reading ${muxFilePath}:`, muxErr);
      process.exit(1);
    }

    const mux = JSON.parse(muxData);

    mux.services = {};
    mux.subchannels = {};
    mux.components = {};

    stations.forEach((station, index) => {
      const { abbreviation } = station;
      const serviceName = `srv-${abbreviation.toLowerCase()}`;
      const serviceId = generateIdFromAbbreviation(station.abbreviation);

      mux.services[serviceName] = {
        id: serviceId,
        label: station.full_name,
        shortlabel: abbreviation,
      };

      const subchannelName = `sub-${abbreviation.toLowerCase()}`;
      const subchannelId = index + 1;
      mux.subchannels[subchannelName] = {
        type: "dabplus",
        bitrate: station.bitrate,
        id: subchannelId,
        protection: 3, // Level 1 is strongest and 4 the lowest error protection, most used is 3
        inputproto: "edi",
        inputuri: `tcp://0.0.0.0:${station.port}`,
      };

      const componentId = `comp-${abbreviation.toLowerCase()}`;
      mux.components[componentId] = {
        service: serviceName,
        subchannel: subchannelName,
      };

      if (station.slideshow) {
        mux.components[componentId]["user-applications"] = {
          userapp: "slideshow",
        };
      }
    });

    fs.writeFile(muxFilePath, JSON.stringify(mux, null, 4), (writeErr) => {
      if (writeErr) {
        console.error(`Error writing to ${muxFilePath}:`, writeErr);
        process.exit(1);
      }
      console.log("Mux file updated successfully.");
    });
  });
});
