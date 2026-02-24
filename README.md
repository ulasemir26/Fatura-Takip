# Fatura & Stok Takip

Bu proje, Windows’ta çalışan **offline (internetsiz)** bir masaüstü uygulamasıdır.

> Bu rehber, teknik bilgisi olmayan kullanıcılar için hazırlanmıştır.

---

## 0) ÖNEMLİ: Sizin hatanızın net sebebi

Sizde iki farklı hata olmuş:

1. **`ash is not recognized`**
   - Sebep: PowerShell’e yanlışlıkla ` ```bash ` yazılmış.
   - Kural: PowerShell’e sadece komut yazılır. ` ``` ` ile başlayan satırlar yazılmaz.

2. **`better-sqlite3` kurulum hatası / Visual Studio C++ hatası**
   - Sebep: Bilgisayarda **Node.js 24** var.
   - Bu projede `better-sqlite3` için en sorunsuz sürüm **Node.js 20 LTS**.

---

## 1) Baştan, temiz ve garantili kurulum (adım adım)

### 1.1 Node.js 20 LTS kurun
1. Denetim Masası > Program Kaldır’dan mevcut Node.js sürümünü kaldırın (varsa).
2. Bilgisayarı yeniden başlatın.
3. https://nodejs.org adresine girin.
4. **Node.js 20 LTS** sürümünü indirin ve kurun.

### 1.2 Sürümü kontrol edin
PowerShell açın, sadece bunu yazın:

`node -v`

Sonuç `v20...` ile başlamalı.

---

## 2) Projeyi OneDrive dışına alın (EPERM hatasını önler)

OneDrive bazen `node_modules` klasörünü kilitler. Bu yüzden proje klasörünü C diskine taşıyın.

Önerilen klasör:

`C:\Projects\Fatura-Takip`

---

## 3) PowerShell’de doğru komut sırası (PowerShell uyumlu, hatasız)

> Dikkat: Aşağıda sadece **tek satır komutlar** var. Satır satır çalıştırın.

1) Proje klasörüne girin:

`cd C:\Projects\Fatura-Takip`

2) PowerShell scripti ile güvenli temizlik yapın (önerilen):

`powershell -ExecutionPolicy Bypass -File .\scripts\windows-reset.ps1`

3) Paketleri yeniden kurun:

`npm install`

4) Uygulamayı başlatın:

`npm run dev`

---

## 4) Kurulum sonrası uygulama açılmıyorsa

### Hata: `concurrently is not recognized`
Bu hata genelde `npm install` başarısız kaldığında olur.

Çözüm:
1. Önce `node -v` ile sürümün gerçekten `v20` olduğundan emin olun.
2. Bölüm 3'teki reset scriptini tekrar çalıştırın.
3. Sonra tekrar çalıştırın:
   - `npm install`
   - `npm run dev`

---

## 5) Windows .exe kurulum dosyası üretme

Uygulama çalışıyorsa, aynı klasörde şu komutu çalıştırın:

`npm run package:win`

Bitince `release` klasörü içinde `.exe` oluşur.

Kurulum için:
1. `.exe` dosyasına çift tıklayın.
2. Kurulum bitince masaüstünde **Fatura & Stok Takip** kısayolu oluşur.

---

## 6) Uygulama içinde nereye basacağım?

Sol menüden sırayla kullanın:

1. **Cariler** → “Yeni Cari”
2. **Stok** → “Ürün Ekle”
3. **Faturalar** → fatura oluştur
4. **Ödeme/Tahsilat** → ödeme veya tahsilat gir
5. **Dashboard** → özetleri gör
6. **Raporlar** → CSV dışa aktar
7. **Yedekleme** → “Manuel Yedek Al” / “Geri Yükle”

---

## 7) Verileriniz nereye kaydolur?

- Veritabanı: `Belgeler/FaturaStokTakip/faturastok.db`
- Yedekler: `Belgeler/FaturaStokTakip/Backups`

---

## 8) En kritik kural (tekrar)

PowerShell’e **asla** şunları yazmayın:
- ` ```bash `
- ` ``` `
- ` ```npm install `

PowerShell’e sadece komutu yazın:
- `npm install`
- `npm run dev`
- `npm run package:win`

Ek not: Bu projede Node sürümü zorunlu olarak `20.x` olmalı. `npm install` sırasında farklı sürümdeyseniz kurulum bilinçli olarak durdurulur.
