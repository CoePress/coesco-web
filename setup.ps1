# setup.ps1

# -----------------------------
# Configuration
# -----------------------------
$nvmInstallerUrl = "https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe"
$nodeVersion = "lts"
$postgresAppId = "PostgreSQL.PostgreSQL"
$databaseName = "coesco_dev"
$postgresPort = 5432

# Helper: Wait for port
function Wait-ForPort {
    param ([int]$Port, [int]$TimeoutSec = 60)

    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        if (Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet) {
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    return $false
}

# -----------------------------
# 1. Install NVM for Windows
# -----------------------------
if (-not (Get-Command nvm.exe -ErrorAction SilentlyContinue)) {
    Write-Host "Installing NVM for Windows..."
    $nvmInstallerPath = "$env:TEMP\nvm-setup.exe"
    Invoke-WebRequest -Uri $nvmInstallerUrl -OutFile $nvmInstallerPath
    Start-Process -FilePath $nvmInstallerPath -Wait
} else {
    Write-Host "NVM is already installed."
}

# Refresh session (in case nvm just installed)
$envPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
if ($envPath -notlike "*nvm*") {
    Write-Warning "You may need to restart your terminal to use NVM commands."
}

# -----------------------------
# 2. Install Node.js via NVM
# -----------------------------
$nvmList = nvm list available
if ($nvmList -match "LTS") {
    Write-Host "Installing latest LTS Node version..."
    nvm install $nodeVersion
    nvm use $nodeVersion
    nvm alias default $nodeVersion
} else {
    Write-Warning "Could not retrieve LTS Node version from NVM. Skipping."
}

# -----------------------------
# 3. Install PostgreSQL
# -----------------------------
if (-not (Get-Command psql.exe -ErrorAction SilentlyContinue)) {
    Write-Host "Installing PostgreSQL..."
    winget install --id $postgresAppId --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "PostgreSQL is already installed."
}

# -----------------------------
# 4. Wait for PostgreSQL to be ready
# -----------------------------
Write-Host "Waiting for PostgreSQL to listen on port $postgresPort..."
if (-not (Wait-ForPort -Port $postgresPort)) {
    Write-Error "PostgreSQL did not become available on port $postgresPort."
    exit 1
}

# -----------------------------
# 5. Create Database If Not Exists
# -----------------------------
$exists = psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$databaseName';" 2>$null
if ($exists.Trim() -ne "1") {
    Write-Host "Creating database: $databaseName"
    psql -U postgres -c "CREATE DATABASE $databaseName;"
} else {
    Write-Host "Database '$databaseName' already exists."
}

Write-Host "`n✅ Environment bootstrap complete!" -ForegroundColor Green
