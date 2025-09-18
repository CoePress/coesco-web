$targetDirectory = "E:\"

Set-Location $targetDirectory

if (-not (Test-Path $targetDirectory)) {
    Write-Error "Directory not found: $targetDirectory"
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Error "Not a git repository: $targetDirectory"
    exit 1
}

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "Committing all changes in: $targetDirectory" -ForegroundColor Green
Write-Host "Date: $currentDate" -ForegroundColor Green
Write-Host "----------------------------------------"

git add .

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes to commit" -ForegroundColor Gray
    exit 0
}

git commit -m "Update: $currentDate"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to commit" -ForegroundColor Red
    exit 1
}

git push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Committed and pushed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Committed but failed to push" -ForegroundColor Red
    exit 1
}

Write-Host "Done!" -ForegroundColor Green