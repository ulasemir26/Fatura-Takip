import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { InvoiceInput, PaymentInput, StockMovementType } from '../shared/types';

const appDir = path.join(app.getPath('documents'), 'FaturaStokTakip');
const dbPath = path.join(appDir, 'faturastok.db');

if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      tax_no TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      barcode TEXT,
      unit TEXT NOT NULL,
      purchase_price REAL,
      sale_price REAL,
      stock REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      location TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL,
      type TEXT NOT NULL,
      contact_id INTEGER NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT,
      subtotal REAL NOT NULL,
      vat_total REAL NOT NULL,
      total REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TRY',
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      contact_id INTEGER NOT NULL,
      invoice_id INTEGER,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      movement_date TEXT NOT NULL,
      source TEXT,
      source_id INTEGER,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
}

export function getDashboard() {
  return {
    totalDebt: db.prepare(`SELECT COALESCE(SUM(total - paid_amount),0) v FROM invoices WHERE type='ALIS'`).get().v,
    totalReceivable: db.prepare(`SELECT COALESCE(SUM(total - paid_amount),0) v FROM invoices WHERE type='SATIS'`).get().v,
    monthInvoices: db.prepare(`SELECT COALESCE(SUM(total),0) v FROM invoices WHERE strftime('%Y-%m', invoice_date)=strftime('%Y-%m','now')`).get().v,
    monthPayments: db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM payments WHERE strftime('%Y-%m', payment_date)=strftime('%Y-%m','now')`).get().v,
    dueSoon: db.prepare(`SELECT i.*, c.name contactName FROM invoices i JOIN contacts c ON c.id=i.contact_id WHERE i.status!='ODENDI' AND i.due_date IS NOT NULL AND date(i.due_date) <= date('now','+7 day') ORDER BY i.due_date LIMIT 10`).all(),
    criticalStock: db.prepare(`SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10`).all(),
    recentMoves: db.prepare(`
      SELECT 'FATURA' kind, invoice_no ref, total amount, created_at date FROM invoices
      UNION ALL
      SELECT 'ODEME' kind, id ref, amount, created_at date FROM payments
      ORDER BY date DESC LIMIT 12`).all()
  };
}

function updateInvoiceStatus(invoiceId: number) {
  const inv = db.prepare(`SELECT total, paid_amount FROM invoices WHERE id=?`).get(invoiceId) as any;
  if (!inv) return;
  const remaining = inv.total - inv.paid_amount;
  const status = remaining <= 0 ? 'ODENDI' : inv.paid_amount > 0 ? 'KISMI' : 'ODENMEDI';
  db.prepare('UPDATE invoices SET status=? WHERE id=?').run(status, invoiceId);
}

function addStockMovement(productId: number, type: StockMovementType, quantity: number, source: string, sourceId: number, note?: string) {
  db.prepare(`INSERT INTO stock_movements (product_id,movement_type,quantity,movement_date,source,source_id,note) VALUES (?,?,?,?,?,?,?)`)
    .run(productId, type, quantity, new Date().toISOString().slice(0, 10), source, sourceId, note || null);
  const multiplier = type === 'CIKIS' ? -1 : 1;
  db.prepare('UPDATE products SET stock = stock + ? WHERE id=?').run(multiplier * quantity, productId);
}

export function createInvoice(payload: InvoiceInput) {
  const tx = db.transaction(() => {
    let subtotal = 0;
    let vatTotal = 0;
    const lines = payload.items.map((item) => {
      const lineBase = item.quantity * item.unitPrice;
      const lineVat = lineBase * (item.vatRate / 100);
      subtotal += lineBase;
      vatTotal += lineVat;
      return { ...item, lineTotal: lineBase + lineVat };
    });
    const total = subtotal + vatTotal;
    const status = 'ODENMEDI';
    const invRes = db.prepare(`INSERT INTO invoices (invoice_no,type,contact_id,invoice_date,due_date,subtotal,vat_total,total,status,currency,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(payload.invoiceNo, payload.type, payload.contactId, payload.invoiceDate, payload.dueDate || null, subtotal, vatTotal, total, status, payload.currency || 'TRY', payload.note || null);
    const invoiceId = Number(invRes.lastInsertRowid);

    const stmt = db.prepare(`INSERT INTO invoice_items (invoice_id,product_id,item_name,quantity,unit,unit_price,vat_rate,line_total) VALUES (?,?,?,?,?,?,?,?)`);
    lines.forEach((l) => {
      stmt.run(invoiceId, l.productId || null, l.itemName, l.quantity, l.unit, l.unitPrice, l.vatRate, l.lineTotal);
      if (payload.adjustStock && l.productId) {
        addStockMovement(l.productId, payload.type === 'ALIS' ? 'GIRIS' : 'CIKIS', l.quantity, 'FATURA', invoiceId, `${payload.invoiceNo} stok hareketi`);
      }
    });
    return invoiceId;
  });
  return tx();
}

export function createPayment(payload: PaymentInput) {
  const tx = db.transaction(() => {
    const res = db.prepare(`INSERT INTO payments (type,contact_id,invoice_id,payment_date,amount,method,note) VALUES (?,?,?,?,?,?,?)`)
      .run(payload.type, payload.contactId, payload.invoiceId || null, payload.date, payload.amount, payload.method, payload.note || null);
    if (payload.invoiceId) {
      db.prepare('UPDATE invoices SET paid_amount = paid_amount + ? WHERE id=?').run(payload.amount, payload.invoiceId);
      updateInvoiceStatus(payload.invoiceId);
    }
    return Number(res.lastInsertRowid);
  });
  return tx();
}

export function getReports() {
  const balances = db.prepare(`
    SELECT c.id, c.name,
      COALESCE(SUM(CASE WHEN i.type='SATIS' THEN i.total - i.paid_amount ELSE 0 END),0) as alacak,
      COALESCE(SUM(CASE WHEN i.type='ALIS' THEN i.total - i.paid_amount ELSE 0 END),0) as borc
    FROM contacts c
    LEFT JOIN invoices i ON i.contact_id = c.id
    GROUP BY c.id,c.name
    ORDER BY c.name`).all();

  const overdue = db.prepare(`SELECT i.*, c.name contactName FROM invoices i JOIN contacts c ON c.id=i.contact_id WHERE i.status!='ODENDI' AND i.due_date IS NOT NULL AND date(i.due_date)<date('now')`).all();
  return { balances, overdue };
}

export function ensureDemoData() {
  const row = db.prepare('SELECT COUNT(*) count FROM contacts').get() as any;
  if (row.count > 0) return false;
  db.prepare(`INSERT INTO contacts (type,name,phone,email) VALUES
    ('TEDARIKCI','Örnek Tedarik A.Ş.','05551234567','satinalma@ornek.com'),
    ('MUSTERI','ABC Market','05559876543','abc@market.com')`).run();
  db.prepare(`INSERT INTO products (code,name,unit,stock,min_stock,purchase_price,sale_price) VALUES
    ('STK-001','Çay 1kg','adet',20,5,120,150),
    ('STK-002','Kahve 500gr','adet',3,5,80,110)`).run();
  return true;
}

export function getDbPath() {
  return dbPath;
}
