# Server

## Development

npx prisma migrate dev --name init

npx prisma migrate dev

npx prisma db push

npx prisma generate

## Deployment

1. SSH into pi
2. cd Coesco
3. git pull
4. npm install

## Devices

| Device                 | MAC Address         | IP Address       |
|------------------------|---------------------|------------------|
| Raspberry Pi (Test)    | B8:27:EB:70:FD:30   | 10.231.64.81     |
| Raspberry Pi (Prod)    | 2C:CF:67:51:5A:F7   | 10.231.64.38     |
| Mazak 200              | 88:13:BF:62:51:A0   | 192.231.64.83    |
| Mazak 350              | AC:15:18:D5:3A:EC   | 192.231.64.53    |
| Mazak 450              | AC:15:18:D8:65:A8   | 192.231.64.45    |
| Doosan                 | XX:XX:XX:XX:XX:XX   | 192.231.64.127   |
| Kuraki Boring Mill     | XX:XX:XX:XX:XX:XX   | XXX.XXX.XX.XXX   |
| OKK                    | XX:XX:XX:XX:XX:XX   | 192.231.64.203   |
| Niigata HN80           | XX:XX:XX:XX:XX:XX   | 192.231.64.202   |
| Niigata SPN63          | XX:XX:XX:XX:XX:XX   | 192.231.64.201   |

## Server

### Service File (/etc/systemd/system/coesco.service)

[Unit]
Description=Coesco Server
After=network.target

[Service]
User=system
WorkingDirectory=/home/system/Coesco/apps/server
ExecStart=/usr/bin/npm start
Environment=FORCE_COLOR=1
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target

### Commands

**Reload daemon**
sudo systemctl daemon-reload

**Enable service to start on boot**
sudo systemctl enable coesco

**Start service**
sudo systemctl start coesco

**Restart service**
sudo systemctl restart coesco

**Stop service**
sudo systemctl stop coesco

**Check service status**
sudo systemctl status coesco

**Tail service logs**
journalctl -f --output=cat -u coesco.service