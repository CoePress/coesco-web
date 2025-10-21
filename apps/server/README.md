# Server

## Development

### Initial Setup

```bash
npm install
npx prisma generate
npm run dev
```

## Database Migrations

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Create and apply migration:
   ```bash
   npm run db:migrate -- --name your_change_description
   ```
3. Commit the migration files to git

### Useful Commands

```bash
# Check migration status
npm run db:migrate:status

# Apply pending migrations (production)
npm run db:migrate:deploy

# Generate Prisma client
npm run db:generate

# Reset database (dev only - deletes all data)
npm run db:reset
```

## API Key Management

API keys are used for system-level access to the server endpoints via the `x-api-key` header.

### Generating API Keys

Generate a new API key using Node.js crypto:

```bash
node -e "console.log(require('crypto').randomUUID())"
```

### Configuring API Keys

Add API keys to your `.env` file as a comma-separated list:

```env
API_KEYS=fe2ac930-94d5-41a4-9ad3-1c1f5910391c,another-key-here,third-key-here
```

### Rotating API Keys

To rotate API keys safely without downtime:

1. Generate a new API key
2. Add the new key to the `API_KEYS` environment variable (keep old keys)
3. Restart the server: `sudo systemctl restart server.service`
4. Update all clients/services to use the new key
5. Once all clients are updated, remove the old key from `API_KEYS`
6. Restart the server again

### Using API Keys

Include the API key in requests via the `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key-here" https://api.cpec.com/endpoint
```

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

**Server Commands**
sudo systemctl daemon-reload
sudo systemctl start server.service
sudo systemctl restart server.service
sudo systemctl stop server.service
sudo systemctl status server.service
journalctl -f --output=cat -u server.service

**Fanuc Commands**
sudo systemctl daemon-reload
sudo systemctl start fanuc.service
sudo systemctl restart fanuc.service
sudo systemctl stop fanuc.service
sudo systemctl status fanuc.service
journalctl -f --output=cat -u fanuc.service

## Deployment Setup

### First-Time Setup: SSH Keys (One-time)

To deploy without password prompts, set up SSH key authentication:

**Windows (PowerShell):**
```powershell
# Create .ssh directory if it doesn't exist
mkdir $env:USERPROFILE\.ssh -ErrorAction SilentlyContinue

# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -N ""

# Copy key to production server (will ask for password one last time)
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh administrator@cp-portal-1 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
```

**Linux/Mac:**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# Copy key to production server
ssh-copy-id administrator@cp-portal-1
```

**On Production Server (passwordless sudo):**
```bash
# SSH into production
ssh administrator@cp-portal-1

# Set up passwordless sudo
echo 'administrator ALL=(ALL) NOPASSWD: ALL' | sudo tee /etc/sudoers.d/administrator
sudo chmod 0440 /etc/sudoers.d/administrator

exit
```

After setup, you can deploy without entering any passwords.

## Server Deployment

Run the deployment script:

```powershell
.\scripts\server-deploy.ps1
```

This script handles:
1. Pruning the monorepo
2. Deleting old source files
3. Uploading new files
4. Installing dependencies
5. Running database migrations
6. Building the application
7. Restarting the service