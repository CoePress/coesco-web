# Deployment

## Automated Deployment

```powershell
.\scripts\server-deploy.ps1
```

Deploys via SSH to production server.

## Manual Deployment

```bash
# Build
npm run build

# Transfer files to server
scp -r dist/ user@server:/path/to/app

# On server
npm ci --production
npm run db:migrate:deploy
npm start
```

## Using PM2

```bash
pm2 start dist/index.js --name coesco-server
pm2 startup
pm2 save
```

## Using Systemd

Create `/etc/systemd/system/coesco-server.service`:

```ini
[Unit]
Description=Coesco Server

[Service]
Type=simple
WorkingDirectory=/opt/coesco/apps/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable coesco-server
sudo systemctl start coesco-server
```
