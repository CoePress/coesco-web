# README

- host: 10.231.200.20
- user: system
- password:password

## Sync

Run the command below from the root directory of your code

```bash
scp -r . system@10.231.200.20:~/App/
```

## Service

```bash
sudo systemctl daemon-reload

# Stop the service
sudo systemctl stop app.service

# Restart the service
sudo systemctl restart app.service

# View logs
journalctl -f --output=cat -u app.service
```
