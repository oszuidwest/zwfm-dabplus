const fs = require('fs');

// Path to the stations configuration
const FILE_PATH = './stations.json';

// Function to validate stations
function validateStations(stations) {
  return stations.map(station => {
    const errors = [];
    if (station.full_name.length > 16) {
      errors.push('Full name longer than 16 characters');
    }
    if (station.bitrate < 32 || station.bitrate > 192 || station.bitrate % 8 !== 0) {
      errors.push('Bitrate is not a multiple of 8, is lower than 32, or higher than 192');
    }
    return { station: station.abbreviation, errors };
  }).filter(station => station.errors.length > 0);
}

// Reading and parsing the JSON file
fs.readFile(FILE_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }
  const json = JSON.parse(data);

  // Validate stations
  const validationResult = validateStations(json.stations);

  // Output results
  if (validationResult.length > 0) {
    console.log('Validation errors found:');
    validationResult.forEach(result => {
      console.log(`Station ${result.station} has the following errors:`);
      result.errors.forEach(error => {
        console.log(`- ${error}`);
      });
    });
  } else {
    console.log('No validation errors found.');
  }
});
