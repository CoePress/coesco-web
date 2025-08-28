# Server

## Development

npx prisma migrate dev --name init

npx prisma migrate dev

npx prisma db push

npx prisma generate


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

### Commands

fanuc.service
server.service

**Reload daemon**
sudo systemctl daemon-reload

**Enable service to start on boot**
sudo systemctl enable <service-file>

**Start service**
sudo systemctl start <service-file>

**Restart service**
sudo systemctl restart <service-file>

**Stop service**
sudo systemctl stop <service-file>

**Check service status**
sudo systemctl status <service-file>

**Tail service logs**
journalctl -f --output=cat -u <service-file>

sudo systemctl daemon-reload
sudo systemctl enable fanuc.service
sudo systemctl enable server.service
sudo systemctl restart fanuc.service


psql -h 10.231.200.38 -U cpec -d coesco

sudo systemctl restart server.service
journalctl -f --output=cat -u server.service