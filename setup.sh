#!/usr/bin/env bash

# Initialize the environment
clear
rm -f /tmp/functions.sh

# Attempt to download the functions library, exit on failure
if ! curl -s -o /tmp/functions.sh "https://raw.githubusercontent.com/oszuidwest/bash-functions/main/common-functions.sh"; then
  echo "*** Failed to download functions library. Please check your network connection! ***"
  exit 1
fi

# Load the downloaded functions library
source /tmp/functions.sh

# Setup environment
set_colors
are_we_root
is_this_linux
is_this_os_64bit
set_timezone "Europe/Amsterdam"

# Gather OS version and architecture
OS_VERSION=$(lsb_release -sr | tr '[:upper:]' '[:lower:]')
OS_ARCH=$(dpkg --print-architecture)

# Check if the script supports the OS version
SUPPORTED_OS=("12" "11")
if [[ ! " ${SUPPORTED_OS[*]} " =~ ${OS_VERSION} ]]; then
  echo "This script does not support Debian version '${OS_VERSION}'. Exiting."
  exit 1
fi

# Verify jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq is not installed. Please install jq to proceed."
  exit 1
fi

# Prepare directories for operation
mkdir -p /var/dab/stations/ /var/dab/mux/ /var/log/dab/stations/ /var/log/dab/mux/

# Set package URLs for audio enc
ODR_AUDIOENC_BASE_URL="https://debian.opendigitalradio.org/pool/main/o/odr-audioenc/odr-audioenc"
ODR_AUDIOENC_VERSION="3.4.0-1"
ODR_AUDIOENC_PACKAGE_URL="${ODR_AUDIOENC_BASE_URL}_${ODR_AUDIOENC_VERSION}~deb${OS_VERSION}u1_${OS_ARCH}.deb"

# Set package URLs for pad enc
ODR_PADENC_BASE_URL="https://debian.opendigitalradio.org/pool/main/o/odr-padenc/odr-padenc"
ODR_PADENC_VERSION="3.0.0-2"
ODR_PADENC_PACKAGE_URL="${ODR_PADENC_BASE_URL}_${ODR_PADENC_VERSION}~deb${OS_VERSION}u1_${OS_ARCH}.deb"

# Set package URLs for dab mux
ODR_DABMUX_BASE_URL="https://debian.opendigitalradio.org/pool/main/o/odr-dabmux/odr-dabmux"
ODR_DABMUX_VERSION="4.4.1-1"
ODR_DABMUX_PACKAGE_URL="${ODR_DABMUX_BASE_URL}_${ODR_DABMUX_VERSION}~deb${OS_VERSION}u1_${OS_ARCH}.deb"

# Set-up dab mux service
DABMUXES_CONFIG_URL="https://raw.githubusercontent.com/oszuidwest/zwfm-dabplus/multimux/multiplexes.json"

# User input for script execution
ask_user "DO_UPDATES" "y" "Do you want to perform all OS updates? (y/n)" "y/n"

# Conditionally update the OS
if [ "$DO_UPDATES" == "y" ]; then
  update_os silent
fi

# Install necessary packages
install_packages silent supervisor logrotate vlc libmagickwand-dev
wget "$ODR_AUDIOENC_PACKAGE_URL" -O /tmp/odr_audioenc.deb
apt -qq -y install /tmp/odr_audioenc.deb --fix-broken
wget "$ODR_PADENC_PACKAGE_URL" -O /tmp/odr_padenc.deb
apt -qq -y install /tmp/odr_padenc.deb --fix-broken
wget "$ODR_DABMUX_PACKAGE_URL" -O /tmp/odr_dabmux.deb
apt -qq -y install /tmp/odr_dabmux.deb --fix-broken

# User input for web interface configuration
ask_user "WEB_PORT" "90" "Choose a port for the web interface" "num"
ask_user "WEB_USER" "admin" "Choose a username for the web interface" "str"
ask_user "WEB_PASSWORD" "encoder" "Choose a password for the web interface" "str"

# Configure the web interface if not already configured
if ! grep -q "\[inet_http_server\]" /etc/supervisor/supervisord.conf; then
  sed -i "/\[supervisord\]/i [inet_http_server]\n port = 0.0.0.0:$WEB_PORT\n username = $WEB_USER\n password = $WEB_PASSWORD" /etc/supervisor/supervisord.conf
  # Cleanup indentation
  sed -i 's/^[ \t]*//' /etc/supervisor/supervisord.conf
fi

# Begin by fetching the DAB multiplexes configuration
echo "Fetching DAB multiplexes configuration..."
curl -s "$DABMUXES_CONFIG_URL" | jq -r '.multiplexes[].allotment' | while read -r ALLOTMENT; do
  
  # For each allotment, generate the corresponding systemd service file
  SERVICE_FILE="/etc/systemd/system/dabmux_$ALLOTMENT.service"
  echo "Generating systemd service file for allotment $ALLOTMENT..."
  cat <<EOF >"$SERVICE_FILE"
[Unit]
Description=DAB+ Multiplexer $ALLOTMENT
After=network.target
Documentation=https://github.com/oszuidwest/zwfm-dabplus

[Service]
Type=simple
ExecStart=odr-dabmux /var/dab/mux/mux_$ALLOTMENT.json
Restart=always
StandardOutput=file:/var/log/dab/mux/dabmux_$ALLOTMENT.log
StandardError=file:/var/log/dab/mux/dabmux_$ALLOTMENT.err

[Install]
WantedBy=multi-user.target
Alias=dabmux_$ALLOTMENT.service
EOF
  echo "Service file $SERVICE_FILE generated."

  # Enable the service
  SERVICE_NAME="dabmux_${ALLOTMENT}.service"
  echo "Enabling $SERVICE_NAME..."
  systemctl enable "$SERVICE_NAME"
done

# After processing all allotments, reload the systemd daemon
echo "Reloading systemd daemon to recognize new services..."
systemctl daemon-reload

# TODO:
# Implement a new service to restart the muxes here

# Final message indicating successful script execution
echo -e "\n${GREEN}✓ Success!${NC}"
echo -e "Reboot this server and everything should start."
echo -e "You can connect to its IP in the browser on port ${BOLD}$WEB_PORT${NC}."
echo -e "The user is ${BOLD}$WEB_USER${NC} and the password you chose is ${BOLD}$WEB_PASSWORD${NC}.\n"
