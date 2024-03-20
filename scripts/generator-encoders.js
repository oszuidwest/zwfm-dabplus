// This file creates encoder configuration files for our DAB+ stations
const fs = require("fs");
const path = require("path");

console.log("Starting script...");

// Define the JSON file path
const jsonFilePath = path.join(__dirname, "..", "stations.json");
console.log(`JSON file path: ${jsonFilePath}`);

// Ensure the 'encoders' directory exists in the parent directory
const encodersDirPath = path.join(__dirname, "..", "encoders");
if (!fs.existsSync(encodersDirPath)) {
  console.log(`Encoders directory not found at ${encodersDirPath}. Creating it...`);
  fs.mkdirSync(encodersDirPath, { recursive: true });
} else {
  console.log(`Encoders directory exists at ${encodersDirPath}.`);
}

// Read and parse the JSON file
fs.readFile(jsonFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the JSON file:", err);
    process.exit(1);
  }

  console.log("JSON file read successfully. Parsing content...");

  let stations;
  try {
    const parsedData = JSON.parse(data);
    stations = parsedData.stations;
    if (!stations) {
      throw new Error("Stations key is missing or invalid in JSON data.");
    }
  } catch (parseError) {
    console.error("Error parsing JSON data:", parseError);
    process.exit(1);
  }

  console.log(`Found ${stations.length} station(s) in JSON data. Processing...`);

  // Iterate over each station
  stations.forEach((station) => {
    // Extract station details and convert abbreviation to lower case
    let { abbreviation } = station;
    const {
      livestream, bitrate, port, slideshow,
    } = station;
    abbreviation = abbreviation.toLowerCase();

    console.log(`Processing station: ${abbreviation}`);

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
    try {
      fs.writeFileSync(audioConfigFilePath, audioConfig);
      console.log(`Audio configuration for ${abbreviation} written successfully.`);
    } catch (writeError) {
      console.error(`Error writing audio configuration for ${abbreviation}:`, writeError);
    }

    // Prepare slideshow directory option based on slideshow boolean
    const slideshowDirOption = slideshow ? `--dir=/var/dab/stations/${abbreviation}/slideshow ` : "";

    // Create the metadata configuration file content with conditional slideshow directory
    const metadataConfig = `[program:dab-${abbreviation}-metadata]
command=odr-padenc --dls=/var/dab/stations/${abbreviation}/metadata/dls.txt ${slideshowDirOption}--output=${abbreviation}_pad
autostart=true
autorestart=true
startretries=9999999999999999999999999999999999999999999999999
stdout_logfile_maxbytes=0MB
stdout_logfile_backups=0
stdout_logfile=/var/log/meta_${abbreviation}.log`;

    // Write the metadata configuration file
    try {
      fs.writeFileSync(metadataConfigFilePath, metadataConfig);
      console.log(`Metadata configuration for ${abbreviation} written successfully.`);
    } catch (writeError) {
      console.error(`Error writing metadata configuration for ${abbreviation}:`, writeError);
      process.exit(1);
    }
  });

  console.log("All stations processed.");
});
