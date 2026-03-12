$PRODUCTION_HOST = "system@raspberrypi"
$PRODUCTION_CLIENT_PATH = "/home/pi/coesco-web/apps/client"

Write-Host "=== Starting Client Deployment ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Building client..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\.."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build client" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`n[2/3] Uploading built files..." -ForegroundColor Yellow
ssh $PRODUCTION_HOST "rm -rf ${PRODUCTION_CLIENT_PATH} && mkdir -p ${PRODUCTION_CLIENT_PATH}"
scp -r "$PSScriptRoot\..\dist\." "${PRODUCTION_HOST}:${PRODUCTION_CLIENT_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload client files" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Updating nginx config and reloading..." -ForegroundColor Yellow
scp "$PSScriptRoot\..\nginx.conf" "${PRODUCTION_HOST}:/tmp/coesco-nginx.conf"
ssh $PRODUCTION_HOST "sudo cp /tmp/coesco-nginx.conf /etc/nginx/sites-available/coesco && sudo ln -sf /etc/nginx/sites-available/coesco /etc/nginx/sites-enabled/coesco && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"

Write-Host "`n=== Client Deployment Complete ===" -ForegroundColor Green
