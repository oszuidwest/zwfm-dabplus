const fs = require('fs');

// Define the JSON file path
const jsonFilePath = './stations.json';

// Check if the JSON file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`JSON file does not exist: ${jsonFilePath}`);
  process.exit(1);
}

// Read and parse the JSON file
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

jsonData.stations.forEach(station => {
  const { abbreviation } = station;

  // Define the directory paths
  const metadataDirPath = `/var/dab/stations/${abbreviation}/metadata`;
  const slideshowDirPath = `/var/dab/stations/${abbreviation}/slideshow`;

  // Output the directories that would be created
  console.log(metadataDirPath);
  console.log(slideshowDirPath);
});
