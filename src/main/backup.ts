import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDbPath } from './db';

const backupDir = path.join(app.getPath('documents'), 'FaturaStokTakip', 'Backups');

export function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
}

export function createBackup() {
  ensureBackupDir();
  const dbPath = getDbPath();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, `backup-${stamp}.db`);
  const temp = `${target}.tmp`;
  fs.copyFileSync(dbPath, temp);
  fs.renameSync(temp, target);
  rotateBackups(30);
  return target;
}

function rotateBackups(max: number) {
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => ({ f, t: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  files.slice(max).forEach((file) => fs.unlinkSync(path.join(backupDir, file.f)));
}

export function listBackups() {
  ensureBackupDir();
  return fs.readdirSync(backupDir)
    .filter((f) => f.endsWith('.db'))
    .map((file) => ({
      file,
      path: path.join(backupDir, file),
      createdAt: fs.statSync(path.join(backupDir, file)).mtime.toISOString()
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function restoreBackup(backupPath: string) {
  const dbPath = getDbPath();
  const temp = `${dbPath}.tmp`;
  fs.copyFileSync(backupPath, temp);
  fs.renameSync(temp, dbPath);
}

export function setupDailyBackup() {
  createBackup();
  return setInterval(() => createBackup(), 1000 * 60 * 60 * 24);
}
