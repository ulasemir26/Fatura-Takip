$ErrorActionPreference = 'Stop'

function Assert-LastExitCode([string]$StepName) {
  if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: $StepName failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "[0/5] Current folder check..." -ForegroundColor Cyan
if (-not (Test-Path .\package.json)) {
  Write-Host "ERROR: package.json not found. Run this script in project root folder." -ForegroundColor Red
  exit 1
}

Write-Host "[1/5] Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force
Assert-LastExitCode "npm cache clean"

Write-Host "[2/5] Cleaning node_modules..." -ForegroundColor Cyan
if (Test-Path .\node_modules) {
  Remove-Item -Recurse -Force .\node_modules
  Write-Host "node_modules removed." -ForegroundColor Green
} else {
  Write-Host "node_modules not found, skipped." -ForegroundColor Yellow
}

Write-Host "[3/5] Cleaning package-lock.json..." -ForegroundColor Cyan
if (Test-Path .\package-lock.json) {
  Remove-Item -Force .\package-lock.json
  Write-Host "package-lock.json removed." -ForegroundColor Green
} else {
  Write-Host "package-lock.json not found, skipped." -ForegroundColor Yellow
}

Write-Host "[4/5] Checking Node.js version..." -ForegroundColor Cyan
node -e "const m=Number(process.versions.node.split('.')[0]); if(m!==20){console.error('ERROR: Node.js 20 LTS required. Current: '+process.versions.node); process.exit(1)} else {console.log('OK: Node version is valid -> '+process.versions.node)}"
Assert-LastExitCode "Node.js version check"

Write-Host "[5/5] Reset completed." -ForegroundColor Green
