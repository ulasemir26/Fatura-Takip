const major = Number(process.versions.node.split('.')[0]);

if (major !== 20) {
  console.error('\n[HATA] Bu proje Node.js 20 LTS ile çalışır.');
  console.error(`[HATA] Mevcut sürüm: ${process.versions.node}`);
  console.error('[ÇÖZÜM] Node.js 20 LTS kurun: https://nodejs.org');
  console.error('[ÇÖZÜM] Sonra şu komutları çalıştırın:');
  console.error('  1) npm cache clean --force');
  console.error('  2) rmdir /s /q node_modules');
  console.error('  3) del package-lock.json');
  console.error('  4) npm install');
  process.exit(1);
}

console.log(`[OK] Node.js sürümü uygun: ${process.versions.node}`);
