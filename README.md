# Fatura & Stok Takip

Bu proje, Windows’ta çalışan **offline (internetsiz)** bir masaüstü uygulamasıdır.

> Bu rehber, "yazılım bilmiyorum" diyen biri için hazırlandı.

---

## 1) Ben ne yapacağım? (Çok kısa özet)

Sadece şu adımları uygulayın:
1. Bilgisayarınıza Node.js kurun.
2. Bu projeyi GitHub’dan indirin.
3. Komutları sırasıyla çalıştırın.
4. Kurulum dosyası (`.exe`) üretin.
5. `.exe` dosyasına çift tıklayıp programı kurun.
6. Masaüstündeki **Fatura & Stok Takip** simgesine tıklayıp uygulamayı açın.

---

## 2) Gerekli tek şeyler

### 2.1 Node.js kurma
1. Tarayıcıdan şurayı açın: **https://nodejs.org**
2. "LTS" yazan sürümü indirin.
3. Kurulumda hep **Next > Next > Finish** yapın.
4. Kurulum bitince bilgisayarı bir kez kapatıp açın (önerilir).

### 2.2 Git kurma (sadece proje indirmek için)
1. Tarayıcıdan şurayı açın: **https://git-scm.com/download/win**
2. İndirip kurun.
3. Kurulumda varsayılan ayarlar genelde yeterli (Next > Next).

---

## 3) Projeyi GitHub’dan indirme (adım adım tıklama)

### Yöntem A (kolay): ZIP ile indir
1. GitHub proje sayfasına gidin.
2. Yeşil **Code** butonuna tıklayın.
3. **Download ZIP** seçin.
4. ZIP’i örneğin `Masaüstü\Fatura-Takip` klasörüne çıkarın.

### Yöntem B (terminal ile)
1. Başlat menüsünden **PowerShell** açın.
2. Aşağıdaki komutu yazın (**yalnızca komut satırını yazın, ` ```bash ` gibi satırları yazmayın**):

   PowerShell'e yazılacak komut:
   `git clone <REPO_LINKINIZ>`

3. Sonra klasöre girin:

   PowerShell'e yazılacak komut:
   `cd Fatura-Takip`

---

## 4) Uygulamayı ilk kez çalıştırma (geliştirme modu)

> Bu adım programın açıldığını test etmek içindir.

PowerShell’de proje klasöründeyken sırayla çalıştırın (**tek tek**):

1. `npm install`
2. `npm run dev`

> Önemli: Markdown kod bloğu satırlarını (ör: ` ```bash `) PowerShell'e yapıştırmayın.

Ne olacak?
- Birkaç saniye sonra uygulama penceresi açılır.
- Açılınca "Demo veri yüklensin mi?" sorusu gelir.
  - İlk deneme için **Evet** deyin.

Kapatmak için:
- Uygulama penceresini kapatın.
- PowerShell’de `Ctrl + C` yapın.

---

## 5) Kurulum dosyası (.exe) üretme

PowerShell’de proje klasöründe şu komutu çalıştırın:

`npm run package:win`

Bitince şurada kurulum dosyası oluşur:
- `release` klasörü içinde `.exe`

Kurulum:
1. `.exe` dosyasına çift tıklayın.
2. Kurulum otomatik ilerler.
3. Masaüstüne **Fatura & Stok Takip** kısayolu gelir.
4. Kısayola çift tıklayıp uygulamayı açın.

---

## 6) Uygulamayı kullanırken nereye basacağım?

Sol menüden sırasıyla:

1. **Cariler**
   - "Yeni Cari" ile müşteri/tedarikçi ekleyin.
2. **Stok**
   - "Ürün Ekle" ile ürünlerinizi girin.
3. **Faturalar**
   - Alış veya satış faturası oluşturun.
4. **Ödeme/Tahsilat**
   - Yapılan ödeme veya alınan tahsilatı kaydedin.
5. **Dashboard**
   - Toplam borç/alacak, kritik stok gibi özetleri görün.
6. **Raporlar**
   - Bakiye raporunu CSV dışa aktarın.
7. **Yedekleme**
   - "Manuel Yedek Al" ile anlık yedek alın.
   - Listeden yedek seçip "Geri Yükle" yapabilirsiniz.

---

## 7) Veriler nereye kaydoluyor?

Uygulama verileri yerel olarak şu yapıda tutulur:
- Veritabanı: `Belgeler/FaturaStokTakip/faturastok.db`
- Yedekler: `Belgeler/FaturaStokTakip/Backups`

Yedekleme davranışı:
- Açılışta otomatik yedek
- Her 24 saatte bir otomatik yedek
- Kapanışta yedek
- Son 30 yedek saklanır

---

## 8) Hata olursa ne yapacağım?

### Sorun 1: `ash is not recognized` veya `bash` hatası alıyorum
- Muhtemelen PowerShell'e yanlışlıkla ` ```bash ` satırını yapıştırdınız.
- Çözüm: Sadece komutun kendisini yazın (ör: `npm install`).
- Asla şu satırları yazmayın: ` ```bash ` veya ` ``` `.

### Sorun 2: `npm install` hata veriyor
- İnternet bağlantınızı kontrol edin.
- Kurumsal bilgisayarda güvenlik duvarı npm’i engelleyebilir; IT ekibine danışın.

### Sorun 3: Uygulama açılmıyor
- PowerShell’i kapatıp yeniden açın.
- Proje klasöründe tekrar `npm run dev` çalıştırın.

### Sorun 4: Kurulumdan sonra kısayol yok
- Başlat menüsünde "Fatura & Stok Takip" arayın.
- Çıkarsa sağ tık → "Dosya konumunu aç" → masaüstüne kısayol gönderin.

---

## 9) Geliştirici notu (teknik özet)

- Electron + React + TypeScript
- SQLite (`better-sqlite3`)
- IPC katmanı ile güvenli renderer/main iletişimi
- Modüller: Dashboard, Cari, Fatura, Ödeme/Tahsilat, Stok, Raporlar, Yedekleme
