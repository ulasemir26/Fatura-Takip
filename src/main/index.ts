import { BrowserWindow, app, dialog, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import { db, initializeDb, getDashboard, createInvoice, createPayment, getReports, ensureDemoData } from './db';
import { createBackup, listBackups, restoreBackup, setupDailyBackup } from './backup';

let mainWindow: BrowserWindow | null = null;
let backupTimer: NodeJS.Timeout | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Fatura & Stok Takip'
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
}

function setupIpc() {
  ipcMain.handle('contacts:list', () => db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all());
  ipcMain.handle('contacts:create', (_, payload) => db.prepare(`INSERT INTO contacts (type,name,tax_no,phone,email,address,note) VALUES (?,?,?,?,?,?,?)`).run(payload.type, payload.name, payload.taxNo || null, payload.phone || null, payload.email || null, payload.address || null, payload.note || null));
  ipcMain.handle('contacts:update', (_, id, payload) => db.prepare(`UPDATE contacts SET type=?,name=?,tax_no=?,phone=?,email=?,address=?,note=? WHERE id=?`).run(payload.type, payload.name, payload.taxNo || null, payload.phone || null, payload.email || null, payload.address || null, payload.note || null, id));
  ipcMain.handle('contacts:delete', (_, id) => db.prepare('DELETE FROM contacts WHERE id=?').run(id));

  ipcMain.handle('products:list', () => db.prepare('SELECT * FROM products ORDER BY created_at DESC').all());
  ipcMain.handle('products:create', (_, payload) => db.prepare(`INSERT INTO products (code,name,category,barcode,unit,purchase_price,sale_price,stock,min_stock,location,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(payload.code, payload.name, payload.category || null, payload.barcode || null, payload.unit, payload.purchasePrice || null, payload.salePrice || null, payload.stock || 0, payload.minStock || 0, payload.location || null, payload.note || null));
  ipcMain.handle('products:update', (_, id, payload) => db.prepare(`UPDATE products SET code=?,name=?,category=?,barcode=?,unit=?,purchase_price=?,sale_price=?,stock=?,min_stock=?,location=?,note=? WHERE id=?`).run(payload.code, payload.name, payload.category || null, payload.barcode || null, payload.unit, payload.purchasePrice || null, payload.salePrice || null, payload.stock || 0, payload.minStock || 0, payload.location || null, payload.note || null, id));
  ipcMain.handle('products:delete', (_, id) => db.prepare('DELETE FROM products WHERE id=?').run(id));

  ipcMain.handle('invoices:list', (_, filters) => {
    const where: string[] = [];
    const params: any[] = [];
    if (filters?.type) { where.push('i.type=?'); params.push(filters.type); }
    if (filters?.status) { where.push('i.status=?'); params.push(filters.status); }
    if (filters?.contactId) { where.push('i.contact_id=?'); params.push(filters.contactId); }
    if (filters?.search) { where.push('(i.invoice_no LIKE ? OR c.name LIKE ?)'); params.push(`%${filters.search}%`, `%${filters.search}%`); }
    if (filters?.dateFrom) { where.push('date(i.invoice_date)>=date(?)'); params.push(filters.dateFrom); }
    if (filters?.dateTo) { where.push('date(i.invoice_date)<=date(?)'); params.push(filters.dateTo); }
    if (filters?.overdue) { where.push("i.status!='ODENDI' AND i.due_date IS NOT NULL AND date(i.due_date)<date('now')"); }
    const sql = `SELECT i.*, c.name contactName FROM invoices i JOIN contacts c ON c.id=i.contact_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY i.invoice_date DESC`;
    return db.prepare(sql).all(...params);
  });
  ipcMain.handle('invoices:create', (_, payload) => createInvoice(payload));
  ipcMain.handle('invoice-items:list', (_, invoiceId) => db.prepare('SELECT * FROM invoice_items WHERE invoice_id=?').all(invoiceId));

  ipcMain.handle('payments:list', (_, filters) => {
    const where: string[] = [];
    const params: any[] = [];
    if (filters?.type) { where.push('p.type=?'); params.push(filters.type); }
    if (filters?.contactId) { where.push('p.contact_id=?'); params.push(filters.contactId); }
    if (filters?.dateFrom) { where.push('date(p.payment_date)>=date(?)'); params.push(filters.dateFrom); }
    if (filters?.dateTo) { where.push('date(p.payment_date)<=date(?)'); params.push(filters.dateTo); }
    const sql = `SELECT p.*, c.name contactName, i.invoice_no invoiceNo FROM payments p JOIN contacts c ON c.id=p.contact_id LEFT JOIN invoices i ON i.id=p.invoice_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.payment_date DESC`;
    return db.prepare(sql).all(...params);
  });
  ipcMain.handle('payments:create', (_, payload) => createPayment(payload));

  ipcMain.handle('dashboard:get', () => getDashboard());
  ipcMain.handle('reports:get', () => getReports());

  ipcMain.handle('backup:create', () => createBackup());
  ipcMain.handle('backup:list', () => listBackups());
  ipcMain.handle('backup:restore', async (_, backupPath) => {
    const choice = await dialog.showMessageBox({ type: 'warning', buttons: ['İptal', 'Geri Yükle'], defaultId: 1, message: 'Yedek geri yüklenecek. Uygulama yeniden başlatılmalı.' });
    if (choice.response === 1) {
      restoreBackup(backupPath);
      app.relaunch();
      app.exit(0);
      return true;
    }
    return false;
  });

  ipcMain.handle('demo:seed', () => ensureDemoData());
}

app.whenReady().then(() => {
  initializeDb();
  setupIpc();
  createWindow();
  backupTimer = setupDailyBackup();
  log.info('App started');
});

app.on('window-all-closed', () => {
  createBackup();
  if (backupTimer) clearInterval(backupTimer);
  if (process.platform !== 'darwin') app.quit();
});
