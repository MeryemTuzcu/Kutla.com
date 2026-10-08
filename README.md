# Kutla.com - Organizasyon Yönetim Sistemi API 🚀

Node.js Backend Programlama Eğitimi bitirme projesi kapsamında geliştirilmiş, düğün, nişan ve kurumsal etkinlik planlama süreçlerini dijitalleştiren B2C odaklı bir RESTful API'dir. Müşteriler mekanları (vendor) listeler, filtreler ve beğendikleri mekana **hizmet talebi (task)** oluşturur. Firmalar taleplerin durumunu günceller.

> Bu proje, yönergedeki "Görev ve Proje Yönetim Sistemi" senaryosunun etkinlik pazar yeri modeline uyarlanmış hâlidir:
> Görev → Hizmet Talebi, Çalışan (assignee) → Organizasyon Firması (vendor), Görev Durumu → Talep Durumu, Öncelik → Talep Önceliği.

## 🛠️ Kullanılan Teknolojiler
* Node.js & Express.js
* CORS
* Global Middleware (Logger, Validator, Global Error Handler)
* REST API Mimarisi (veriler bellekte tutulur, veritabanı kullanılmaz)

## ⚙️ Kurulum ve Çalıştırma

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/MeryemTuzcu/Kutla.com.git
   cd Kutla.com
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Sunucuyu başlatın:**
   ```bash
   npm start
   ```
   Geliştirme sırasında otomatik yeniden başlatma için `npm run dev` kullanabilirsiniz.

   Sunucu başarıyla başladığında konsolda `Kutla.com Backend API 3000 portunda çalışıyor...` mesajını göreceksiniz. Port değiştirmek için `PORT` ortam değişkeni kullanılabilir.

4. **Test edin:** Tarayıcıdan veya Postman'den `http://localhost:3000/` adresine istek atın.

> Not: Veriler bellekte tutulduğu için sunucu yeniden başlatıldığında başlangıç verilerine dönülür.

## 📁 Proje Yapısı
```
src/
├── server.js              # Sunucuyu başlatır
├── app.js                 # Middleware, route ve hata yakalama tanımları
├── routes/                # vendorRoutes, taskRoutes, reportRoutes
├── controllers/           # İş mantığı
├── middlewares/           # logger.js, validator.js
├── data/database.js       # Bellek içi veri ve sabitler
└── utils/                 # Yardımcı fonksiyonlar (sayfalama, hata yanıtı, metin karşılaştırma)
```

## 🔌 Endpoint Özeti

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/vendors` | Mekanları filtreleyerek listeler (sayfalama destekli) |
| GET | `/vendors/:id` | Mekan detayı |
| POST | `/tasks` | Yeni hizmet talebi oluşturur |
| GET | `/tasks` | Tüm talepleri listeler (filtre, sıralama, sayfalama) |
| GET | `/tasks/search?keyword=` | Anahtar kelimeyle talep arama |
| GET | `/tasks/:id` | Talep detayı |
| GET | `/tasks/customer/:customerName` | Müşterinin talepleri |
| GET | `/tasks/vendor/:vendorId` | Firmaya gelen talepler |
| PATCH | `/tasks/:id` | Talebi kısmen günceller |
| DELETE | `/tasks/:id` | Talebi siler |
| GET | `/reports/summary` | Genel sistem özeti |
| GET | `/reports/completed` | Anlaşılan talep sayısı |
| GET | `/reports/pending` | Bekleyen talep sayısı |

## ✅ Öne Çıkan Özellikler
* **Logger middleware:** Her isteğin zaman damgası (Türkiye saati), metodu, adresi, durum kodu ve süresi konsola yazılır.
* **Doğrulama:** Eksik veya hatalı veri için açıklayıcı mesajlarla `400 Bad Request`.
* **İş kuralları:** 1000 TL altı bütçe (`422`), mekan kapasitesi aşımı (`422`), aynı mekana tekrar bekleyen talep (`409`), aynı mekan ve tarihe çift rezervasyon (`409`).
* **Durum geçmişi:** Her talepte durumun ne zaman değiştiği `statusHistory` alanında tutulur.
* **Global error handler:** Beklenmeyen hatalarda `500 Internal Server Error`.
---
## 📚 Teslim Dokümanları

| Doküman | Dosya |
|---------|-------|
| Proje Tanıtım Dokümanı | [docs/PROJE_TANITIM.pdf](./docs/KutlaCom.pdf) |
| API Dokümantasyonu | [API_DOCS.md](./API_DOCS.md) |
| Postman Test Ekran Görüntüleri | [docs/postman/PostmanTestleri.pdf](./docs/postman/PostmanTestleri.pdf) |
| Logger Kanıtı | [docs/logger.png](./docs/logger.png) |

