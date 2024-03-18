// Try to re-implement `create_encoders.sh` in JS

const fs = require('fs');
const path = require('path');

// Define the JSON file path
const jsonFilePath = path.join(__dirname, 'stations.json'); // One up from the working dir

// Ensure the 'encoders' directory exists in the current working directory
const encodersDirPath = path.join(__dirname, 'encoders');
if (!fs.existsSync(encodersDirPath)) {
  fs.mkdirSync(encodersDirPath, { recursive: true });
}

// Read and parse the JSON file
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the JSON file:', err);
    return;
  }

  const stations = JSON.parse(data).stations;

  // Iterate over each station
  stations.forEach(station => {
    const { abbreviation, livestream, bitrate, port } = station;

    // Paths for the configuration files within the 'encoders' directory
    const audioConfigFilePath = path.join(encodersDirPath, `${abbreviation}-audio.conf`);
    const metadataConfigFilePath = path.join(encodersDirPath, `${abbreviation}-metadata.conf`);

    // Create the audio configuration file content
    const audioConfig = `[program:dab-${abbreviation}-audio]
command=odr-audioenc -v ${livestream} -b ${bitrate} -P ${abbreviation}_pad -e tcp://localhost:${port}
autostart=true
autorestart=true
startretries=9999999999999999999999999999999999999999999999999
stdout_logfile_maxbytes=0MB
stdout_logfile_backups=0
stdout_logfile=/var/log/audio_${abbreviation}.log`;

    // Write the audio configuration file
    fs.writeFileSync(audioConfigFilePath, audioConfig);

    // Create the metadata configuration file content
    const metadataConfig = `[program:dab-${abbreviation}-metadata]
command=odr-padenc --dls=/var/dab/${abbreviation}/metadata/dls.txt --dir=/var/dab/${abbreviation}/slideshow --output=${abbreviation}_pad
autostart=true
autorestart=true
startretries=9999999999999999999999999999999999999999999999999
stdout_logfile_maxbytes=0MB
stdout_logfile_backups=0
stdout_logfile=/var/log/meta_${abbreviation}.log`;

    // Write the metadata configuration file
    fs.writeFileSync(metadataConfigFilePath, metadataConfig);
  });
});
