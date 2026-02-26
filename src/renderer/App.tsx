import { useEffect, useMemo, useState } from 'react';

type Tab = 'dashboard' | 'cariler' | 'faturalar' | 'odemeler' | 'stok' | 'raporlar' | 'yedekler';

const fmtMoney = (n = 0) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);

  const refreshAll = async () => {
    const [c, p, i, pay, d, r, b] = await Promise.all([
      window.api.contacts.list(),
      window.api.products.list(),
      window.api.invoices.list(),
      window.api.payments.list(),
      window.api.dashboard.get(),
      window.api.reports.get(),
      window.api.backup.list()
    ]);
    setContacts(c); setProducts(p); setInvoices(i); setPayments(pay); setDashboard(d); setReports(r); setBackups(b);
  };

  useEffect(() => {
    refreshAll();
    if (confirm('Demo verileri yüklensin mi? (İlk kurulum için önerilir)')) {
      window.api.demo.seed().then(() => refreshAll());
    }
  }, []);

  const nav = [
    ['dashboard', 'Dashboard'], ['cariler', 'Cariler'], ['faturalar', 'Faturalar'], ['odemeler', 'Ödeme/Tahsilat'], ['stok', 'Stok'], ['raporlar', 'Raporlar'], ['yedekler', 'Yedekleme']
  ] as const;

  return (
    <div className="layout">
      <aside>
        <h1>Fatura & Stok Takip</h1>
        {nav.map(([k, label]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k as Tab)}>{label}</button>)}
        <button onClick={refreshAll}>Yenile</button>
      </aside>
      <main>
        {tab === 'dashboard' && dashboard && <Dashboard dashboard={dashboard} />}
        {tab === 'cariler' && <Contacts contacts={contacts} onSaved={refreshAll} />}
        {tab === 'faturalar' && <Invoices contacts={contacts} products={products} invoices={invoices} onSaved={refreshAll} />}
        {tab === 'odemeler' && <Payments contacts={contacts} invoices={invoices} payments={payments} onSaved={refreshAll} />}
        {tab === 'stok' && <Products products={products} onSaved={refreshAll} />}
        {tab === 'raporlar' && reports && <Reports reports={reports} />}
        {tab === 'yedekler' && <Backups backups={backups} onSaved={refreshAll} />}
      </main>
    </div>
  );
}

function Dashboard({ dashboard }: any) {
  return <div>
    <h2>Ana Özet</h2>
    <div className="cards">{[
      ['Toplam Borç', fmtMoney(dashboard.totalDebt)],
      ['Toplam Alacak', fmtMoney(dashboard.totalReceivable)],
      ['Bu Ay Fatura', fmtMoney(dashboard.monthInvoices)],
      ['Bu Ay Ödeme', fmtMoney(dashboard.monthPayments)]
    ].map(([t, v]) => <article key={t}><h3>{t}</h3><p>{v}</p></article>)}</div>
    <section><h3>Kritik Stok</h3><ul>{dashboard.criticalStock.map((p: any) => <li key={p.id}>{p.name} ({p.stock})</li>)}</ul></section>
    <section><h3>Vadesi Yaklaşan/Gecikmiş</h3><ul>{dashboard.dueSoon.map((i: any) => <li key={i.id}>{i.invoice_no} - {i.contactName} - {fmtMoney(i.total - i.paid_amount)}</li>)}</ul></section>
  </div>;
}

function Contacts({ contacts, onSaved }: any) {
  const [f, setF] = useState<any>({ type: 'MUSTERI', name: '' });
  return <div><h2>Cari Yönetimi</h2>
    <form onSubmit={async (e) => { e.preventDefault(); await window.api.contacts.create(f); setF({ type: 'MUSTERI', name: '' }); onSaved(); }} className="form-grid">
      <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="MUSTERI">Müşteri</option><option value="TEDARIKCI">Tedarikçi</option><option value="HER_IKISI">Her İkisi</option></select>
      <input placeholder="Ünvan/Ad" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input placeholder="Telefon" value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <button>Yeni Cari</button>
    </form>
    <table><thead><tr><th>Ad</th><th>Tür</th><th>Telefon</th><th></th></tr></thead><tbody>
      {contacts.map((c: any) => <tr key={c.id}><td>{c.name}</td><td>{c.type}</td><td>{c.phone}</td><td><button onClick={async () => { await window.api.contacts.delete(c.id); onSaved(); }}>Sil</button></td></tr>)}
    </tbody></table></div>;
}

function Invoices({ contacts, products, invoices, onSaved }: any) {
  const [filter, setFilter] = useState<any>({ search: '', type: '' });
  const [rows, setRows] = useState<any[]>([{ itemName: '', quantity: 1, unit: 'adet', unitPrice: 0, vatRate: 20 }]);
  const [f, setF] = useState<any>({ type: 'ALIS', currency: 'TRY', adjustStock: true, invoiceDate: new Date().toISOString().slice(0, 10) });
  const filtered = useMemo(() => invoices.filter((i: any) => (!filter.type || i.type === filter.type) && (!filter.search || `${i.invoice_no} ${i.contactName}`.toLowerCase().includes(filter.search.toLowerCase()))), [invoices, filter]);
  return <div><h2>Fatura Takip</h2>
    <div className="form-grid">
      <input placeholder="Ara: fatura no/cari" onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
      <select onChange={(e) => setFilter({ ...filter, type: e.target.value })}><option value="">Tüm Tipler</option><option value="ALIS">Alış</option><option value="SATIS">Satış</option></select>
    </div>
    <form onSubmit={async (e) => { e.preventDefault(); await window.api.invoices.create({ ...f, items: rows, contactId: Number(f.contactId) }); setRows([{ itemName: '', quantity: 1, unit: 'adet', unitPrice: 0, vatRate: 20 }]); onSaved(); }}>
      <div className="form-grid">
      <input placeholder="Fatura No" required onChange={(e) => setF({ ...f, invoiceNo: e.target.value })} />
      <select required onChange={(e) => setF({ ...f, type: e.target.value })}><option value="ALIS">Alış</option><option value="SATIS">Satış</option></select>
      <select required onChange={(e) => setF({ ...f, contactId: e.target.value })}><option>Cari</option>{contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input type="date" defaultValue={f.invoiceDate} onChange={(e) => setF({ ...f, invoiceDate: e.target.value })} />
      <input type="date" onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
      </div>
      {rows.map((r, idx) => <div key={idx} className="form-grid">
        <input placeholder="Ürün/Hizmet" value={r.itemName} onChange={(e) => setRows(rows.map((x, i) => i === idx ? { ...x, itemName: e.target.value } : x))} />
        <input type="number" value={r.quantity} onChange={(e) => setRows(rows.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x))} />
        <input type="number" value={r.unitPrice} onChange={(e) => setRows(rows.map((x, i) => i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))} />
        <input type="number" value={r.vatRate} onChange={(e) => setRows(rows.map((x, i) => i === idx ? { ...x, vatRate: Number(e.target.value) } : x))} />
      </div>)}
      <button type="button" onClick={() => setRows([...rows, { itemName: '', quantity: 1, unit: 'adet', unitPrice: 0, vatRate: 20 }])}>Satır Ekle</button>
      <button>Fatura Kaydet</button>
    </form>
    <table><thead><tr><th>No</th><th>Cari</th><th>Tip</th><th>Tutar</th><th>Durum</th></tr></thead><tbody>{filtered.map((i: any) => <tr key={i.id}><td>{i.invoice_no}</td><td>{i.contactName}</td><td>{i.type}</td><td>{fmtMoney(i.total)}</td><td>{i.status}</td></tr>)}</tbody></table>
  </div>;
}

function Payments({ contacts, invoices, payments, onSaved }: any) {
  const [f, setF] = useState<any>({ type: 'ODEME', method: 'NAKIT', date: new Date().toISOString().slice(0, 10) });
  return <div><h2>Ödeme / Tahsilat</h2>
    <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); await window.api.payments.create({ ...f, contactId: Number(f.contactId), invoiceId: f.invoiceId ? Number(f.invoiceId) : undefined, amount: Number(f.amount) }); onSaved(); }}>
      <select onChange={(e) => setF({ ...f, type: e.target.value })}><option value="ODEME">Ödeme</option><option value="TAHSILAT">Tahsilat</option></select>
      <select required onChange={(e) => setF({ ...f, contactId: e.target.value })}><option>Cari</option>{contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select onChange={(e) => setF({ ...f, invoiceId: e.target.value })}><option value="">Fatura (opsiyonel)</option>{invoices.map((i: any) => <option key={i.id} value={i.id}>{i.invoice_no}</option>)}</select>
      <input type="number" step="0.01" required placeholder="Tutar" onChange={(e) => setF({ ...f, amount: e.target.value })} />
      <select onChange={(e) => setF({ ...f, method: e.target.value })}><option value="NAKIT">Nakit</option><option value="HAVALE_EFT">Havale/EFT</option><option value="KREDI_KARTI">Kredi Kartı</option><option value="DIGER">Diğer</option></select>
      <button>Kaydet</button>
    </form>
    <table><thead><tr><th>Tarih</th><th>Tip</th><th>Cari</th><th>Tutar</th><th>Yöntem</th></tr></thead><tbody>{payments.map((p: any) => <tr key={p.id}><td>{p.payment_date}</td><td>{p.type}</td><td>{p.contactName}</td><td>{fmtMoney(p.amount)}</td><td>{p.method}</td></tr>)}</tbody></table>
  </div>;
}

function Products({ products, onSaved }: any) {
  const [f, setF] = useState<any>({ unit: 'adet', stock: 0, minStock: 0 });
  return <div><h2>Stok Takip</h2>
    <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); await window.api.products.create({ ...f, stock: Number(f.stock), minStock: Number(f.minStock) }); setF({ unit: 'adet', stock: 0, minStock: 0 }); onSaved(); }}>
      <input placeholder="Stok kodu" required onChange={(e) => setF({ ...f, code: e.target.value })} />
      <input placeholder="Ürün adı" required onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input placeholder="Birim" defaultValue="adet" onChange={(e) => setF({ ...f, unit: e.target.value })} />
      <input type="number" placeholder="Mevcut stok" onChange={(e) => setF({ ...f, stock: e.target.value })} />
      <input type="number" placeholder="Minimum stok" onChange={(e) => setF({ ...f, minStock: e.target.value })} />
      <button>Ürün Ekle</button>
    </form>
    <table><thead><tr><th>Kod</th><th>Ürün</th><th>Stok</th><th>Min</th><th></th></tr></thead><tbody>{products.map((p: any) => <tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.stock}</td><td>{p.min_stock}</td><td><button onClick={async () => { await window.api.products.delete(p.id); onSaved(); }}>Sil</button></td></tr>)}</tbody></table>
  </div>;
}

function Reports({ reports }: any) {
  const exportCsv = () => {
    const rows = [['Cari', 'Borç', 'Alacak'], ...reports.balances.map((b: any) => [b.name, b.borc, b.alacak])];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cari-bakiye-raporu.csv';
    a.click();
  };
  return <div><h2>Raporlar</h2>
    <button onClick={exportCsv}>CSV Dışa Aktar</button>
    <h3>Cari Bakiye</h3>
    <table><thead><tr><th>Cari</th><th>Borç</th><th>Alacak</th></tr></thead><tbody>{reports.balances.map((b: any) => <tr key={b.id}><td>{b.name}</td><td>{fmtMoney(b.borc)}</td><td>{fmtMoney(b.alacak)}</td></tr>)}</tbody></table>
    <h3>Vadesi Geçmiş</h3>
    <ul>{reports.overdue.map((o: any) => <li key={o.id}>{o.invoice_no} - {o.contactName} - {fmtMoney(o.total - o.paid_amount)}</li>)}</ul>
  </div>;
}

function Backups({ backups, onSaved }: any) {
  return <div><h2>Yedekleme</h2>
    <button onClick={async () => { await window.api.backup.create(); onSaved(); }}>Manuel Yedek Al</button>
    <ul>{backups.map((b: any) => <li key={b.path}>{b.file} <button onClick={async () => { await window.api.backup.restore(b.path); }}>Geri Yükle</button></li>)}</ul>
  </div>;
}
