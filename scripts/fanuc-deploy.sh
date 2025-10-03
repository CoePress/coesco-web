#!/bin/bash

set -e

# Read the existing fanuc-deploy.ps1 to extract the deployment logic
# This is a bash equivalent for Linux/Mac/WSL environments

echo "Deploy Fanuc Adapter"
echo "Target: linux-arm"
echo ""

LINUX_HOST="10.231.200.38"
LINUX_USER="system"
FANUC_ROOT="/home/system/Fanuc"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FANUC_PROJECT="$SCRIPT_DIR/../apps/fanuc/FanucAdapter/FanucAdapter.csproj"
FANUC_BUILD="$SCRIPT_DIR/../apps/fanuc/FanucAdapter/out/linux-arm"
FANUC_SO="$SCRIPT_DIR/../apps/fanuc/FanucAdapter/native/libfwlib32-linux-armv7.so.1.0.5"

echo "🚀 Deploying FanucAdapter..."

# Step 0: Build
echo "Publishing FanucAdapter for linux-arm..."
dotnet publish "$FANUC_PROJECT" -c Release -r linux-arm --self-contained true -o "$FANUC_BUILD"

# Step 1: Reset remote
echo "Resetting $FANUC_ROOT..."
ssh "${LINUX_USER}@${LINUX_HOST}" "rm -rf $FANUC_ROOT && mkdir -p $FANUC_ROOT"

# Step 2: Copy build
echo "Copying build..."
scp -r "$FANUC_BUILD"/* "${LINUX_USER}@${LINUX_HOST}:${FANUC_ROOT}/"

# Step 3: Copy .so
echo "Copying .so..."
scp "$FANUC_SO" "${LINUX_USER}@${LINUX_HOST}:/tmp/"

# Step 4: Symlinks
echo "Configuring symlinks..."
ssh "${LINUX_USER}@${LINUX_HOST}" "sudo rm -f /usr/local/lib/libfwlib32-linux-*.so* ; sudo cp /tmp/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/ ; sudo ln -sf /usr/local/lib/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/libfwlib32.so.1 ; sudo ln -sf /usr/local/lib/libfwlib32.so.1 /usr/local/lib/libfwlib32.so ; sudo ldconfig"

# Step 5: Logs
echo "Preparing fwlibeth.log..."
ssh "${LINUX_USER}@${LINUX_HOST}" "cd $FANUC_ROOT && rm -f fwlibeth.log && touch fwlibeth.log && chmod 666 fwlibeth.log && sudo rm -f /var/log/fwlibeth.log && sudo touch /var/log/fwlibeth.log && sudo chmod 666 /var/log/fwlibeth.log"

# Step 6: Executable
echo "Marking executable..."
ssh "${LINUX_USER}@${LINUX_HOST}" "cd $FANUC_ROOT && chmod +x FanucAdapter"

# Step 7: Free port 5000
echo "Clearing port 5000..."
ssh "${LINUX_USER}@${LINUX_HOST}" "sudo fuser -k 5000/tcp || true"

echo "✅ Fanuc deployment complete. Staged at $FANUC_ROOT"
