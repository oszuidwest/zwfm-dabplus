#!/usr/bin/env bash

# Initialize the environment
clear
rm -f /tmp/functions.sh
if ! curl -s -o /tmp/functions.sh https://raw.githubusercontent.com/oszuidwest/bash-functions/main/common-functions.sh; then
  echo "*** Failed to download functions library. Please check your network connection! ***"
  exit 1
fi

# Load functions library
source /tmp/functions.sh

# Configure environment
set_colors
are_we_root
is_this_linux
is_this_os_64bit
set_timezone Europe/Amsterdam

# Detect OS details
OS_VERSION=$(lsb_release -sr | tr '[:upper:]' '[:lower:]')
OS_ARCH=$(dpkg --print-architecture)

# Validate OS version (TODO: Check if this is really Debian!!)
SUPPORTED_OS=("12" "11")
if [[ ! " ${SUPPORTED_OS[*]} " =~ ${OS_VERSION} ]]; then
  printf "This script does not support Debian version '%s'. Exiting.\n" "$OS_VERSION"
  exit 1
fi

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
DABMUX_SERVICE_PATH="/etc/systemd/system/dabmux.service"
DABMUX_SERVICE_URL="https://raw.githubusercontent.com/oszuidwest/zwfm-dabplus/main/config/dabmux.service"

# User input for script execution
ask_user "DO_UPDATES" "y" "Do you want to perform all OS updates? (y/n)" "y/n"

# Perform OS updates if desired by user
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

# Always ask these
ask_user "WEB_PORT" "90" "Choose a port for the web interface" "num"
ask_user "WEB_USER" "admin" "Choose a username for the web interface" "str"
ask_user "WEB_PASSWORD" "encoder" "Choose a password for the web interface" "str"

# Configure the web interface
if ! grep -q "\[inet_http_server\]" /etc/supervisor/supervisord.conf; then
  sed -i "/\[supervisord\]/i\
  [inet_http_server]\n\
  port = 0.0.0.0:$WEB_PORT\n\
  username = $WEB_USER\n\
  password = $WEB_PASSWORD\n\
  " /etc/supervisor/supervisord.conf
  # Tidy up file after wrting to it
  sed -i 's/^[ \t]*//' /etc/supervisor/supervisord.conf
fi

# Add a service for ODR-DabMux
echo -e "${BLUE}►► Setting up service for ODR-DabMux...${NC}"
rm -f "$DABMUX_SERVICE_PATH" > /dev/null
curl -s -o "$DABMUX_SERVICE_PATH" "$DABMUX_SERVICE_URL"
systemctl daemon-reload > /dev/null
systemctl enable dabmux > /dev/null

# Add a watcher for dabmux restarts
DABMUX_RESTART_CRONJOB="0 3 * * * [ -f /tmp/.restart-dabmux-needed ] && systemctl restart dabmux && rm -f /tmp/.restart-dabmux-needed"
echo -e "${BLUE}►► Setting up cronjob for dabmux restart...${NC}"
# Check if the crontab exists for the current user, create one if not
if ! crontab -l 2>/dev/null; then
  echo "No crontab for $(whoami). Creating one..."
  echo "" | crontab -
fi
# Add the DABMUX_RESTART_CRONJOB to the crontab if it's not already present
(crontab -l 2>/dev/null | grep -Fv "${DABMUX_RESTART_CRONJOB}"; echo "${DABMUX_RESTART_CRONJOB}") | crontab -

# Create basic dirs
mkdir -p /etc/dab/stations/
mkdir -p /etc/dab/mux/

# Fin 
echo -e "\n${GREEN}✓ Success!${NC}"
echo -e "Reboot this device and everything should start."
echo -e "You can connect to it's IP in the brower on port ${BOLD}$WEB_PORT${NC}."
echo -e "The user is ${BOLD}$WEB_USER${NC} and the password you choose is ${BOLD}$WEB_PASSWORD${NC}.\n"