param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("fanuc", "server", "both")]
    [string]$App
)

# -------------------------------
# Config
# -------------------------------
$linuxHost  = "10.231.200.38"
$linuxUser  = "system"
$fanucRoot  = "/home/system/Fanuc"
$serverRoot = "/home/system/Server"

$scriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Definition
$fanucProject = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\FanucAdapter.csproj"
$fanucBuild   = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\out\linux-arm\*"
$fanucSo      = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\native\libfwlib32-linux-armv7.so.1.0.5"

# -------------------------------
# Helper
# -------------------------------
function Deploy-Fanuc {
    Write-Host "`n🚀 Deploying FanucAdapter..."

    # Step 0: Build
    Write-Host "Publishing FanucAdapter for linux-arm..."
    dotnet publish $fanucProject -c Release -r linux-arm --self-contained true -o (Join-Path $scriptDir "apps\fanuc\FanucAdapter\out\linux-arm")

    # Step 1: Reset remote
    Write-Host "Resetting $fanucRoot..."
    ssh "$($linuxUser)@$($linuxHost)" "rm -rf $fanucRoot && mkdir -p $fanucRoot"

    # Step 2: Copy build
    Write-Host "Copying build..."
    scp -r $fanucBuild "$($linuxUser)@$($linuxHost):$fanucRoot/"

    # Step 3: Copy .so
    Write-Host "Copying .so..."
    scp $fanucSo "$($linuxUser)@$($linuxHost):/tmp/"

    # Step 4: Symlinks
    Write-Host "Configuring symlinks..."
    ssh "$($linuxUser)@$($linuxHost)" "sudo rm -f /usr/local/lib/libfwlib32-linux-*.so* ; sudo cp /tmp/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/ ; sudo ln -sf /usr/local/lib/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/libfwlib32.so.1 ; sudo ln -sf /usr/local/lib/libfwlib32.so.1 /usr/local/lib/libfwlib32.so ; sudo ldconfig"

    # Step 5: Logs
    Write-Host "Preparing fwlibeth.log..."
    ssh "$($linuxUser)@$($linuxHost)" "cd $fanucRoot && rm -f fwlibeth.log && touch fwlibeth.log && chmod 666 fwlibeth.log && sudo rm -f /var/log/fwlibeth.log && sudo touch /var/log/fwlibeth.log && sudo chmod 666 /var/log/fwlibeth.log"

    # Step 6: Executable
    Write-Host "Marking executable..."
    ssh "$($linuxUser)@$($linuxHost)" "cd $fanucRoot && chmod +x FanucAdapter"

    # Step 7: Free port 5000
    Write-Host "Clearing port 5000..."
    ssh "$($linuxUser)@$($linuxHost)" "sudo fuser -k 5000/tcp || true"

    Write-Host "✅ Fanuc deployment complete. Staged at $fanucRoot"
}

function Deploy-Server {
    Write-Host "`n🚀 Deploying Server..."
    # TODO: Add publish/copy/reset steps similar to Fanuc
    # Example:
    # dotnet publish ...
    # ssh/scp steps...
    Write-Host "⚠️  Server deploy not yet implemented."
}

# -------------------------------
# Dispatch
# -------------------------------
switch ($App) {
    "fanuc" { Deploy-Fanuc }
    "server" { Deploy-Server }
    "both" {
        Deploy-Fanuc
        Deploy-Server
    }
}