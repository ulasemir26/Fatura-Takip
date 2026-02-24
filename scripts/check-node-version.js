const major = Number(process.versions.node.split('.')[0]);

if (major !== 20) {
  console.error('\n[ERROR] This project requires Node.js 20 LTS.');
  console.error(`[ERROR] Current version: ${process.versions.node}`);
  console.error('[ACTION] Install Node.js 20 LTS: https://nodejs.org');
  console.error('[ACTION] Then run in project folder:');
  console.error('  1) powershell -ExecutionPolicy Bypass -File .\\scripts\\windows-reset.ps1');
  console.error('  2) npm install');
  process.exit(1);
}

console.log(`[OK] Node.js version is valid: ${process.versions.node}`);
