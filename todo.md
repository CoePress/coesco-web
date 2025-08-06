# README

## To Do

- Add ability to reset the fanuc adapter from portal
- Move coesco-web repo into coe press organization
  - Upgrade to pro plan on vercel or look into other hosting options
- Setup proper CI/CD for both frontend & backend

## Tools

- GitHub Teams ($4/user/month - enables branch protection & rulesets for private repos)
- Azure Key Vault ($0.03 per 10,000 transactions - cache keys on startup to reduce calls)
- Vercel Pro ($20/user/month - can get by with one account)
- Google API (free with limits)

## Questions

- Should we separate machines, parts & services in quote-details?
- What fields do we want displayed in quote-details items table?
- Who can access the option rule-manager?
- Should we swap reference number with name (default to "Untitled Performance Sheet")?


TODO: Create service on pi
sudo nano /etc/systemd/system/server.service

[Unit]
Description=Coesco Server
After=network.target

[Service]
ExecStart=/usr/bin/npm start
WorkingDirectory=/server
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
User=pi

[Install]
WantedBy=multi-user.target

sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable server
sudo systemctl start server

journalctl -f --output=cat -u coesco.service
