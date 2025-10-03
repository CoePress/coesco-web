$PRODUCTION_HOST = "administrator@cp-portal-1"
$PRODUCTION_PATH = "/home/administrator/coesco"

Write-Host "=== Starting Server Deployment ==="

# 1. Prune the monorepo for your server app (source only)
Write-Host "Step 1: Pruning monorepo..."
turbo prune @coesco/server --out-dir deploy

# 2. Send ONLY the source files to production
Write-Host "Step 2: Sending files to production..."
Push-Location deploy
scp -r . "${PRODUCTION_HOST}:${PRODUCTION_PATH}/"
Pop-Location

# 3-7. Execute remaining steps on production server
Write-Host "Step 3-7: Installing dependencies, generating Prisma client, building, and restarting service on production..."
ssh $PRODUCTION_HOST @"
cd /home/administrator/coesco

# 3. Install dependencies on production
npm install

# 4. Generate Prisma client
cd apps/server
npx prisma generate

# 5. Build the server app
cd ../..
turbo run build --filter=@coesco/server

# 6. Restart the service
sudo systemctl restart server.service

# 7. Check service status
sudo systemctl status server.service
"@

Write-Host ""
Write-Host "=== Deployment Complete ==="
Write-Host "To view logs, run:"
Write-Host "ssh $PRODUCTION_HOST 'journalctl -f --output=cat -u server.service'"
