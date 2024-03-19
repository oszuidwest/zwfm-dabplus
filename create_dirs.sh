#!/bin/bash

# Define the JSON file path
json_file="/root/stations.json"

# Check if the JSON file exists
if [ ! -f "$json_file" ]; then
  echo "JSON file does not exist: $json_file"
  exit 1
fi

echo "Processing JSON file: $json_file"

# Use jq to read stations
jq -c '.stations[]' "$json_file" | while IFS= read -r station; do
  # Extract station details
  abbreviation=$(jq -r '.abbreviation' <<< "$station")
  full_name=$(jq -r '.full_name' <<< "$station")
  livestream=$(jq -r '.livestream' <<< "$station")
  bitrate=$(jq -r '.bitrate' <<< "$station")
  port=$(jq -r '.port' <<< "$station")
  
  echo "Processing station: $abbreviation"

  # Create the directory structure for the station
  mkdir -p "/var/dab/stations/$abbreviation/metadata"
  mkdir_status=$?
  mkdir -p "/var/dab/stations/$abbreviation/slideshow"
  mkdir_slideshow_status=$?

  if [ $mkdir_status -ne 0 ]; then
    echo "Failed to create metadata directory for $abbreviation"
  else
    echo "Metadata directory created for $abbreviation"
  fi

  if [ $mkdir_slideshow_status -ne 0 ]; then
    echo "Failed to create slideshow directory for $abbreviation"
  else
    echo "Slideshow directory created for $abbreviation"
  fi

  # Create the dls.txt file with the full_name of the station
  echo "$full_name" > "/var/dab/stations/$abbreviation/metadata/dls.txt"
  echo_status=$?
  
  if [ $echo_status -ne 0 ]; then
    echo "Failed to create dls.txt for $abbreviation"
  else
    echo "dls.txt created for $abbreviation"
  fi

  # Create an empty PNG file for the slideshow
  touch "/var/dab/stations/$abbreviation/slideshow/$abbreviation.png"
  touch_status=$?

  if [ $touch_status -ne 0 ]; then
    echo "Failed to create PNG file for $abbreviation"
  else
    echo "PNG file created for $abbreviation"
  fi

done
