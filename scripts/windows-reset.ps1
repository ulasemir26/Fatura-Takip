Write-Host "[1/4] npm cache temizleniyor..." -ForegroundColor Cyan
npm cache clean --force

Write-Host "[2/4] node_modules temizleniyor..." -ForegroundColor Cyan
if (Test-Path .\node_modules) {
  Remove-Item -Recurse -Force .\node_modules
  Write-Host "node_modules silindi." -ForegroundColor Green
} else {
  Write-Host "node_modules yok, atlandı." -ForegroundColor Yellow
}

Write-Host "[3/4] package-lock.json temizleniyor..." -ForegroundColor Cyan
if (Test-Path .\package-lock.json) {
  Remove-Item -Force .\package-lock.json
  Write-Host "package-lock.json silindi." -ForegroundColor Green
} else {
  Write-Host "package-lock.json yok, atlandı." -ForegroundColor Yellow
}

Write-Host "[4/4] Node sürümü kontrol ediliyor..." -ForegroundColor Cyan
node -e "const m=Number(process.versions.node.split('.')[0]); if(m!==20){console.error('HATA: Node.js 20 LTS gerekli. Mevcut: '+process.versions.node); process.exit(1)} else {console.log('OK: Node sürümü uygun -> '+process.versions.node)}"
