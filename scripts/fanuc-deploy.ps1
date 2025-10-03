$linuxHost  = "10.231.200.38"
$linuxUser  = "system"
$fanucRoot  = "/home/system/Fanuc"

$scriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Definition
$fanucProject = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\FanucAdapter.csproj"
$fanucBuild   = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\out\linux-arm\*"
$fanucSo      = Join-Path $scriptDir "..\apps\fanuc\FanucAdapter\native\libfwlib32-linux-armv7.so.1.0.5"

Write-Host "`n🚀 Deploying FanucAdapter..."

Write-Host "Publishing FanucAdapter for linux-arm..."
dotnet publish $fanucProject -c Release -r linux-arm --self-contained true -o $fanucBuild

Write-Host "Resetting $fanucRoot..."
ssh "$($linuxUser)@$($linuxHost)" "rm -rf $fanucRoot && mkdir -p $fanucRoot"

Write-Host "Copying build..."
scp -r $fanucBuild "$($linuxUser)@$($linuxHost):$fanucRoot/"

Write-Host "Copying .so..."
scp $fanucSo "$($linuxUser)@$($linuxHost):/tmp/"

Write-Host "Configuring symlinks..."
ssh "$($linuxUser)@$($linuxHost)" "sudo rm -f /usr/local/lib/libfwlib32-linux-*.so* ; sudo cp /tmp/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/ ; sudo ln -sf /usr/local/lib/libfwlib32-linux-armv7.so.1.0.5 /usr/local/lib/libfwlib32.so.1 ; sudo ln -sf /usr/local/lib/libfwlib32.so.1 /usr/local/lib/libfwlib32.so ; sudo ldconfig"

Write-Host "Preparing fwlibeth.log..."
ssh "$($linuxUser)@$($linuxHost)" "cd $fanucRoot && rm -f fwlibeth.log && touch fwlibeth.log && chmod 666 fwlibeth.log && sudo rm -f /var/log/fwlibeth.log && sudo touch /var/log/fwlibeth.log && sudo chmod 666 /var/log/fwlibeth.log"

Write-Host "Marking executable..."
ssh "$($linuxUser)@$($linuxHost)" "cd $fanucRoot && chmod +x FanucAdapter"

Write-Host "Clearing port 5000..."
ssh "$($linuxUser)@$($linuxHost)" "sudo fuser -k 5000/tcp || true"

Write-Host "✅ Fanuc deployment complete. Staged at $fanucRoot"