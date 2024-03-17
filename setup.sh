#!/usr/bin/env bash

# Initialize the environment
clear
rm -f /tmp/functions.sh
if ! curl -s -o /tmp/functions.sh https://raw.githubusercontent.com/oszuidwest/bash-functions/main/common-functions.sh; then
  echo "*** Failed to download functions library. Please check your network connection! ***"
  exit 1
fi

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

# Validate OS version
SUPPORTED_OS=("12" "11")
if [[ ! " ${SUPPORTED_OS[*]} " =~ ${OS_VERSION} ]]; then
  printf "This script does not support Debian version '%s'. Exiting.\n" "$OS_VERSION"
  exit 1
fi

# Set package URLs
ODR_AUDIOENC_BASE_URL="https://debian.opendigitalradio.org/pool/main/o/odr-audioenc/odr-audioenc"
ODR_AUDIOENC_VERSION="3.4.0-1"
ODR_AUDIOENC_PACKAGE_URL="${ODR_AUDIOENC_BASE_URL}_${ODR_AUDIOENC_VERSION}~deb${OS_VERSION}u1_${OS_ARCH}.deb"

# User input for script execution
ask_user "DO_UPDATES" "y" "Do you want to perform all OS updates? (y/n)" "y/n"

# Perform OS updates if desired by user
if [ "$DO_UPDATES" == "y" ]; then
  update_os silent
fi

# Install necessary packages
install_packages silent fdkaac libfdkaac-ocaml libfdkaac-ocaml-dynlink
wget "$ODR_AUDIOENC_PACKAGE_URL" -O /tmp/odr_audioenc.deb
apt -qq -y install /tmp/odr_audioenc.deb --fix-broken
