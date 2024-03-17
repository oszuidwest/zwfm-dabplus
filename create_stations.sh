#!/bin/bash

# Define the JSON file path
json_file="/root/stations.json"

# Starting port number
port=7000

# Iterate over each station in the JSON file
jq -c '.stations[]' "$json_file" | while read -r station; do
  # Extract station details
  abbreviation=$(echo "$station" | jq -r '.abbreviation')
  full_name=$(echo "$station" | jq -r '.full_name')
  livestream=$(echo "$station" | jq -r '.livestream')
  bitrate=$(echo "$station" | jq -r '.bitrate')

  # Create the directory structure for the station
  mkdir -p "/var/dab/$abbreviation/metadata"
  mkdir -p "/var/dab/$abbreviation/slideshow"

  # Create the dls.txt file with the full_name of the station
  echo "$full_name" > "/var/dab/$abbreviation/metadata/dls.txt"

  # Create an empty PNG file for the slideshow
  touch "/var/dab/$abbreviation/slideshow/$abbreviation.png"

  # Create the audio configuration file
  cat << EOF > "/etc/supervisor/conf.d/${abbreviation}-audio.conf"
[program:dab-${abbreviation}-audio]
command=odr-audioenc -v ${livestream} -b ${bitrate} -P ${abbreviation}_pad -e tcp://localhost:${port}
autostart=true
autorestart=true
startretries=9999999999999999999999999999999999999999999999999
stdout_logfile_maxbytes=0MB
stdout_logfile_backups=0
stdout_logfile=/var/log/audio_${abbreviation}.log
EOF

  # Create the metadata configuration file
  cat << EOF > "/etc/supervisor/conf.d/${abbreviation}-metadata.conf"
[program:dab-${abbreviation}-metadata]
command=odr-padenc --dls=/var/dab/$abbreviation/metadata/dls.txt --dir=/var/dab/$abbreviation/slideshow --output=${abbreviation}_pad
autostart=true
autorestart=true
startretries=9999999999999999999999999999999999999999999999999
stdout_logfile_maxbytes=0MB
stdout_logfile_backups=0
stdout_logfile=/var/log/meta_${abbreviation}.log
EOF

  # Increment the port number by 10 for the next station
  port=$((port + 10))
done
