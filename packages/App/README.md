# README

- host: 10.231.200.20
- user: system
- password: password

## Sync

Run the command below from the root directory of your code

```bash
scp -r . system@10.231.200.20:~/App/
```

## Service

```bash
sudo systemctl daemon-reload
sudo systemctl restart app.service
journalctl -f --output=cat -u app.service
```
