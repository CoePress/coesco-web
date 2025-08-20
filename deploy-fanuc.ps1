# -------------------------------
# Configuration
# -------------------------------
$linuxHost   = "10.231.200.38"
$linuxUser   = "system"
$remoteRoot  = "/home/system/TestFanuc"
$localProject = "C:\Users\jar\Code\coesco-web\apps\fanuc\FanucAdapter\FanucAdapter.csproj"
$localBuild  = "C:\Users\jar\Code\coesco-web\apps\fanuc\FanucAdapter\out\linux-arm\*"
$localSo     = "C:\Users\jar\Code\coesco-web\apps\fanuc\FanucAdapter\native\libfwlib32-linux-armv7.so.1.0.5"

# -------------------------------
# Step 0: Build for linux-arm (self-contained)
# -------------------------------
Write-Host "Publishing FanucAdapter for linux-arm..."
dotnet publish $localProject -c Release -r linux-arm --self-contained true -o "C:\Users\jar\Code\coesco-web\apps\fanuc\FanucAdapter\out\linux-arm"

# -------------------------------
# Step 1: Reset remote folder
# -------------------------------
Write-Host "Resetting $remoteRoot on Linux..."
ssh "$($linuxUser)@$($linuxHost)" "rm -rf $remoteRoot && mkdir -p $remoteRoot"

# -------------------------------
# Step 2: Copy published app
# -------------------------------
Write-Host "Copying published app to $remoteRoot..."
scp -r $localBuild "$($linuxUser)@$($linuxHost):$remoteRoot/"

# -------------------------------
# Step 3: Copy .so to /usr/local/lib
# -------------------------------
Write-Host "Copying .so to /usr/local/lib..."
scp $localSo "$($linuxUser)@$($linuxHost):/tmp/"

# -------------------------------
# Step 4: Configure symlinks on Linux (clean old, add new)
# -------------------------------
Write-Host "Configuring symlinks for libfwlib32.so..."
ssh "$($linuxUser)@$($linuxHost)" "sudo rm -f /usr/local/lib/libfwlib32-linux-*.so* ; sudo cp /tmp/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/ ; sudo ln -sf /usr/local/lib/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/libfwlib32.so.1 ; sudo ln -sf /usr/local/lib/libfwlib32.so.1 /usr/local/lib/libfwlib32.so ; sudo ldconfig"

# -------------------------------
# Step 5: Prepare log files (critical!)
# -------------------------------
Write-Host "Preparing fwlibeth.log..."
ssh "$($linuxUser)@$($linuxHost)" "cd $remoteRoot && rm -f fwlibeth.log && touch fwlibeth.log && chmod 666 fwlibeth.log && sudo rm -f /var/log/fwlibeth.log && sudo touch /var/log/fwlibeth.log && sudo chmod 666 /var/log/fwlibeth.log"

# -------------------------------
# Step 6: Make adapter executable
# -------------------------------
Write-Host "Making FanucAdapter executable..."
ssh "$($linuxUser)@$($linuxHost)" "cd $remoteRoot && chmod +x FanucAdapter"

# -------------------------------
# Step 7: Kill anything bound to port 5000
# -------------------------------
Write-Host "Killing any process on port 5000..."
ssh "$($linuxUser)@$($linuxHost)" "sudo fuser -k 5000/tcp || true"

Write-Host "✅ Deployment complete. App staged at $remoteRoot, logs initialized, port 5000 cleared."
