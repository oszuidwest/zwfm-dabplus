const fs = require("fs");
const path = require("path");

// Define the JSON file path and 'encoders' directory path at the top
const jsonFilePath = path.join(__dirname, "..", "stations.json");
const encodersDirPath = path.join(__dirname, "..", "encoders");

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function writeConfigFile(filePath, content, abbreviation, configType) {
  try {
    fs.writeFileSync(filePath, content);
  } catch (error) {
    console.error(`Error writing ${configType} configuration for ${abbreviation}:`, error);
    process.exit(1);
  }
}

function createConfig(options) {
  const programLine = `[program:${options.program}]`;
  const commandLine = `command=${options.command}`;
  delete options.program;
  delete options.command;
  
  const configLines = Object.entries(options).map(([key, value]) => `${key}=${value}`);
  
  return [programLine, commandLine, ...configLines].join("\n");
}

function generateConfigFiles(abbreviation, station) {
  const {
    livestream, bitrate, port, slideshow,
  } = station;
  
  // Define base configuration common to both audio and metadata configurations
  const baseConfig = {
    autostart: "true",
    autorestart: "true",
    startretries: "999999999",
    redirect_stderr: "true",
    stdout_logfile_maxbytes: "3MB",
    stdout_logfile_backups: "99",
  };

  // Audio configuration
  const audioConfig = createConfig({
    ...baseConfig,
    stdout_logfile: `/var/log/audio_${abbreviation}.log`, // Correctly set log file path for audio
    program: `dab-${abbreviation}-audio`,
    command: `odr-audioenc -v ${livestream} -b ${bitrate} -P ${abbreviation}_pad -e tcp://localhost:${port}`,
  });

  // Metadata configuration, conditionally including slideshow directory option
  const slideshowDirOption = slideshow ? `--dir=/var/dab/stations/${abbreviation}/slideshow` : "";
  const metadataConfig = createConfig({
    ...baseConfig,
    stdout_logfile: `/var/log/metadata_${abbreviation}.log`,
    program: `dab-${abbreviation}-metadata`,
    command: `odr-padenc --dls=/var/dab/stations/${abbreviation}/metadata/dls.txt ${slideshowDirOption} --output=${abbreviation}_pad`,
  });

  // Generate and write the configuration files
  const audioConfigFilePath = path.join(encodersDirPath, `${abbreviation}-audio.conf`);
  writeConfigFile(audioConfigFilePath, audioConfig, abbreviation, "audio");

  const metadataConfigFilePath = path.join(encodersDirPath, `${abbreviation}-metadata.conf`);
  writeConfigFile(metadataConfigFilePath, metadataConfig, abbreviation, "metadata");

  console.log(`Generated encoders for ${abbreviation}.`);
}

function processStationsData(data) {
  let stations;
  try {
    stations = JSON.parse(data).stations;
    if (!stations) {
      throw new Error("Stations key is missing or invalid in JSON data.");
    }
  } catch (parseError) {
    console.error("Error parsing JSON data:", parseError);
    process.exit(1);
  }

  stations.forEach(station => {
    generateConfigFiles(station.abbreviation.toLowerCase(), station);
  });
}

// Ensure the 'encoders' directory exists
ensureDirectoryExists(encodersDirPath);

// Read and parse the JSON file
fs.readFile(jsonFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the JSON file:", err);
    process.exit(1);
  }

  processStationsData(data);
});
