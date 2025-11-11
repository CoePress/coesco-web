$PRODUCTION_HOST = "administrator@cp-portal-1"
$PRODUCTION_PATH = "/home/administrator/coesco"

Write-Host "=== Starting Server Deployment ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Pruning monorepo..." -ForegroundColor Yellow
turbo prune @coesco/server --out-dir deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to prune monorepo" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Deleting old source and uploading new files..." -ForegroundColor Yellow
ssh $PRODUCTION_HOST "rm -rf ${PRODUCTION_PATH}/apps/server/src"
Push-Location deploy
scp -r . "${PRODUCTION_HOST}:${PRODUCTION_PATH}/"
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload files" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Installing dependencies, running migrations, and building..." -ForegroundColor Yellow
ssh $PRODUCTION_HOST "cd ${PRODUCTION_PATH} && npm install && cd apps/server && npm run db:migrate:deploy && npm run db:migrate:scripts && npx prisma generate && cd ../.. && turbo run build --filter=@coesco/server"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build application" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] Restarting service and checking status..." -ForegroundColor Yellow
ssh $PRODUCTION_HOST "sudo systemctl restart server.service && sleep 3 && sudo systemctl status server.service --no-pager -n 10"

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "`nTo view logs, run:" -ForegroundColor Cyan
Write-Host "  ssh $PRODUCTION_HOST 'journalctl -f --output=cat -u server.service'" -ForegroundColor White
