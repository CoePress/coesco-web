# PostgreSQL Setup

## 1. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Run the installer
- During installation, set a password for the `postgres` user (use `password` for dev)
- Keep default port `5432`

## 2. Add PostgreSQL to PATH permanently
Open PowerShell **as Administrator** and run:
```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\PostgreSQL\17\bin", "Machine")
```
**Close and reopen PowerShell** for the change to take effect.

## 3. Create the Database
Open PowerShell and run:
```bash
psql -U postgres
```
Enter password when prompted.

Then in the PostgreSQL prompt:
```sql
CREATE DATABASE coesco_dev;
\q
```

## 4. Verify Connection
```bash
psql -U postgres -d coesco_dev
```

## 5. Your Connection String
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/coesco_dev
```