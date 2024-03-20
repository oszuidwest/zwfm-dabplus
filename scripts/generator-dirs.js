// This file creates the directory framework for the stations
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Define the JSON file path using path.join for cross-platform compatibility
const jsonFilePath = path.join(__dirname, "..", "stations.json");

// Check if the JSON file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`JSON file does not exist: ${jsonFilePath}`);
  process.exit(1);
} else {
  console.log(`JSON file found: ${jsonFilePath}`);
}

// Read and parse the JSON file
let jsonData;
try {
  const fileContent = fs.readFileSync(jsonFilePath, "utf8");
  jsonData = JSON.parse(fileContent);
  console.log("JSON file successfully parsed.");
} catch (error) {
  console.error("Error reading or parsing the JSON file:", error);
  process.exit(1);
}

// Function to log activities for each station
function logStationActivities(logMessages) {
  // Log all collected messages at once
  console.log(logMessages.join("\n"));
}

// Validate jsonData structure
if (!jsonData.stations || !Array.isArray(jsonData.stations)) {
  console.error("Invalid JSON data structure: \"stations\" key is missing or not an array.");
  process.exit(1);
}

// Define the base directory path for stations one level up from the current script location
const baseDirPath = path.join(__dirname, "..", "stations");

// Process each station in the JSON file
jsonData.stations.forEach((station) => {
  if (!station.abbreviation || !station.full_name) {
    console.error("Station missing required information (abbreviation, full_name). Skipping...");
    return;
  }

  const logMessages = [];
  const abbreviation = station.abbreviation.toLowerCase();

  // Define the directory path for station metadata using path.join
  const metadataDirPath = path.join(baseDirPath, abbreviation, "metadata");

  try {
    fs.mkdirSync(metadataDirPath, { recursive: true });
    logMessages.push(`Created directory: ${metadataDirPath}`);
  } catch (error) {
    console.error(`Failed to create directory: ${metadataDirPath}`, error);
    return;
  }

  const dlsFilePath = path.join(metadataDirPath, "dls.txt");
  try {
    fs.writeFileSync(dlsFilePath, `${station.full_name} nu ook op DAB+`);
    logMessages.push(`Created file: ${dlsFilePath}`);
  } catch (error) {
    console.error(`Failed to write file: ${dlsFilePath}`, error);
    return;
  }

  let logoCreationPromise = Promise.resolve();

  if (station.slideshow) {
    const slideshowDirPath = path.join(baseDirPath, abbreviation, "slideshow");
    try {
      fs.mkdirSync(slideshowDirPath, { recursive: true });
      logMessages.push(`Created directory: ${slideshowDirPath}`);
    } catch (error) {
      console.error(`Failed to create slideshow directory: ${slideshowDirPath}`, error);
      return;
    }

    const canvasWidth = 320;
    const canvasHeight = 240;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
    const rgb = abbreviation.split("").reduce((acc, char) => {
      const val = char.charCodeAt(0);
      return { r: (acc.r + val) % 256, g: (acc.g + val * 2) % 256, b: (acc.b + val * 3) % 256 };
    }, { r: 0, g: 0, b: 0 });

    ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = "bold 150px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(station.abbreviation.charAt(0).toUpperCase(), canvasWidth / 2, canvasHeight / 2);

    const logoPath = path.join(slideshowDirPath, "logo.png");
    logoCreationPromise = new Promise((resolve, reject) => {
      const out = fs.createWriteStream(logoPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        logMessages.push(`Created logo: ${logoPath}`);
        resolve();
      }).on("error", (error) => {
        console.error(`Failed to save logo: ${logoPath}`, error);
        reject(error);
      });
    });
  }

  logoCreationPromise.then(() => {
    logStationActivities(logMessages);
  }).catch((error) => {
    console.error("Error in logo creation process:", error);
  });
});
