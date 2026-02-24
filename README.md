# Fatura & Stok Takip

Windows üzerinde çalışan, **offline-first** masaüstü uygulamasıdır. İnternetsiz ortamda cari, fatura, ödeme/tahsilat ve stok süreçlerini tek noktadan takip etmeyi hedefler.

## Mimari Plan (Özet)
- **Masaüstü Katmanı:** Electron (main + preload)
- **UI Katmanı:** React + TypeScript + sade modern tasarım
- **Veri Katmanı:** SQLite (`better-sqlite3`), yerel dosyada kalıcı saklama
- **İletişim:** Renderer -> Preload -> IPC -> Main process servisleri
- **Yedekleme:** Belgeler/FaturaStokTakip/Backups altında günlük otomatik + manuel yedek

## Veri Modeli Taslağı
- `contacts`: müşteri/tedarikçi cari kartları
- `products`: ürün kartları ve mevcut stok
- `invoices`: alış/satış faturaları, toplamlar, ödenen/kalan
- `invoice_items`: fatura satırları
- `payments`: ödeme/tahsilat hareketleri
- `stock_movements`: giriş/çıkış/düzeltme hareketleri

## Modüller
- Dashboard (borç/alacak, bu ay özetleri, kritik stok, yaklaşan vade)
- Cari Yönetimi (CRUD)
- Fatura Takip (alış/satış, satır bazlı ürün/hizmet, filtre/arama)
- Ödeme/Tahsilat (kısmi ödeme desteği)
- Stok Takip (ürün CRUD)
- Raporlar (cari bakiye + vadesi geçmiş, CSV export)
- Yedekleme (manuel + restore)

## Kurulum
```bash
npm install
npm run dev
```

## Build / Installer
```bash
npm run package:win
```

- `electron-builder` NSIS one-click installer üretir.
- Masaüstü kısayolu otomatik oluşturulur.

## Yedekleme Stratejisi
- Uygulama açılışında ve her 24 saatte otomatik yedek.
- Uygulama kapanırken güvenli yedek oluşturma.
- Son 30 yedek saklanır.
- Yedek geri yükleme ekranı mevcuttur (uygulama yeniden başlatılır).

## Demo Veri
İlk açılışta kullanıcıya demo veri yükleme sorusu gösterilir.

## Notlar
- Tüm işlemler yerel cihazda yapılır.
- SQL sorguları parametreli çalıştırılır.
- Arayüz Türkçe locale para/tarih kullanımına göre şekillendirilmiştir.
