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

# Make dir
mkdir -p /var/dab/web/public/

# Install necessary packages
install_packages silent python3 python3-zmq python3-websockets caddy

# Define required variables
FIRST_IP=$(hostname -I | awk '{print $1}')
WEBSOCKET_SERVICE_PATH="/etc/systemd/system/websocket.service"
WEBSOCKET_SERVICE_URL="https://raw.githubusercontent.com/oszuidwest/zwfm-dabplus/main/config/websocket.service"
WEBSOCKET_PYTHON_PATH="/var/dab/web/websocket.py"
WEBSOCKET_PYTHON_SCRIPT="https://raw.githubusercontent.com/oszuidwest/zwfm-dabplus/main/web/websocket.py"
WEBSOCKET_GUI_PATH="/var/dab/web/public/index.html"
WEBSOCKET_GUI_SCRIPT="https://raw.githubusercontent.com/oszuidwest/zwfm-dabplus/main/web/index.html"

# Download files
rm -f "$WEBSOCKET_GUI_PATH" > /dev/null
rm -f "$WEBSOCKET_PYTHON_PATH" > /dev/null
curl -s -o "$WEBSOCKET_GUI_PATH" "$WEBSOCKET_GUI_SCRIPT"
curl -s -o "$WEBSOCKET_PYTHON_PATH" "$WEBSOCKET_PYTHON_SCRIPT"

# Add a service for websocket
echo -e "${BLUE}►► Setting up service for websockets...${NC}"
rm -f "$WEBSOCKET_SERVICE_PATH" > /dev/null
curl -s -o "$WEBSOCKET_SERVICE_PATH" "$WEBSOCKET_SERVICE_URL"
systemctl daemon-reload > /dev/null
systemctl enable websocket > /dev/null
systemctl start websocket

# Patch index file
sed -i "s|ws://localhost:8765|ws://${FIRST_IP}:8765|g" "$WEBSOCKET_GUI_PATH"

# Patch Caddyfile
sed -i 's|root \* /usr/share/caddy|root \* /var/dab/web/public|g' "/etc/caddy/Caddyfile"
systemctl restart caddy