#!/bin/bash

# Define the JSON file path
json_file="/root/stations.json"

# Use jq to read stations
jq -c '.stations[]' "$json_file" | while IFS= read -r station; do
  # Extract station details
  abbreviation=$(jq -r '.abbreviation' <<< "$station")
  full_name=$(jq -r '.full_name' <<< "$station")
  livestream=$(jq -r '.livestream' <<< "$station")
  bitrate=$(jq -r '.bitrate' <<< "$station")
  port=$(jq -r '.port' <<< "$station")
  
  # Create the directory structure for the station
  mkdir -p "/var/dab/stations/$abbreviation/metadata"
  mkdir -p "/var/dab/stations/$abbreviation/slideshow"

  # Create the dls.txt file with the full_name of the station
  echo "$full_name" > "/var/dab/stations/$abbreviation/metadata/dls.txt"

  # Create an empty PNG file for the slideshow
  touch "/var/dab/stations/$abbreviation/slideshow/$abbreviation.png"

done
