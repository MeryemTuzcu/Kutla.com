# 📖 Kutla.com - API Dokümantasyonu

Bu belge, Kutla.com API'sindeki tüm uç noktaların kullanımını, parametrelerini, örnek istek/cevaplarını ve hata kodlarını içerir.

**Base URL:** `http://localhost:3000`
**İçerik tipi:** `Content-Type: application/json`

## Genel Bilgiler

### Talep (Task) Nesnesi
```json
{
  "id": 2,
  "vendorId": 3,
  "customerName": "Arya",
  "eventDate": "2027-09-14",
  "guestCount": 150,
  "budget": 50000,
  "priority": "Yüksek",
  "status": "Fiyat Bekleniyor",
  "statusHistory": [
    { "status": "Fiyat Bekleniyor", "changedAt": "2026-09-28T12:00:00.000Z" }
  ],
  "createdAt": "2026-09-28T12:00:00.000Z",
  "updatedAt": "2026-09-28T12:00:00.000Z"
}
```

### Geçerli Değerler
| Alan | Değerler |
|------|----------|
| `status` | `Fiyat Bekleniyor` (varsayılan), `Anlaşıldı`, `Reddedildi` |
| `priority` | `Düşük`, `Orta` (varsayılan), `Yüksek` |

### Hata Formatı
Tüm hatalar aynı yapıdadır:
```json
{ "error": "Bad Request", "message": "Açıklayıcı hata mesajı" }
```

| Kod | Anlamı | Ne zaman döner |
|-----|--------|----------------|
| 400 | Bad Request | Eksik/geçersiz veri, geçersiz sorgu parametresi, bozuk JSON, değiştirilemez alanı güncelleme denemesi |
| 404 | Not Found | Talep, mekan veya endpoint bulunamadı |
| 409 | Conflict | Aynı mekana bekleyen talep var veya mekan o tarihte dolu |
| 422 | Unprocessable Entity | İş kuralı ihlali: bütçe 1000 TL altında, davetli sayısı kapasiteyi aşıyor |
| 500 | Internal Server Error | Beklenmeyen sunucu hatası |

---

## 1. Vendors (Mekan ve Firmalar)

### `GET /vendors`
Mekanları listeler. Filtreleme ve sayfalama destekler.

| Query | Açıklama |
|-------|----------|
| `category` | Kategori (Düğün, Nişan, İş Yemeği, Doğum Günü, Yılbaşı) |
| `district` | İlçe |
| `maxBudget` | En yüksek fiyat |
| `minCapacity` | En düşük kapasite |
| `page`, `limit` | Sayfalama (limit en fazla 100) |

**Örnek:** `GET /vendors?category=Düğün&district=Sarıyer&page=1&limit=2`

**200 OK**
```json
{
  "total": 2,
  "page": 1,
  "limit": 2,
  "totalPages": 1,
  "data": [
    { "id": 1, "name": "Fındıksuyu Cam Bahçe", "category": "Düğün", "district": "Sarıyer", "capacity": 400, "price": 150000 },
    { "id": 2, "name": "Sait Halim Paşa Yalısı", "category": "Düğün", "district": "Sarıyer", "capacity": 500, "price": 350000 }
  ]
}
```
`total`, filtrelenmiş toplam kayıt sayısıdır. `page` ve `limit` gönderilmezse tüm liste `total` ve `data` ile döner.

### `GET /vendors/:id`
Tek bir mekanın detayını getirir. Bulunamazsa `404`.

---

## 2. Tasks (Hizmet Talepleri)

### `POST /tasks`
Yeni hizmet talebi oluşturur. Durum otomatik olarak `Fiyat Bekleniyor` olur.

**Body**
```json
{
  "vendorId": 3,
  "customerName": "Arya",
  "eventDate": "2027-09-14",
  "guestCount": 150,
  "budget": 50000,
  "priority": "Yüksek"
}
```
`priority` isteğe bağlıdır (varsayılan `Orta`). Diğer tüm alanlar zorunludur. `vendorId`, `guestCount` tam sayı; `budget` sayı; `eventDate` gelecekte bir tarih ve `YYYY-AA-GG` biçiminde olmalıdır.

**201 Created**
```json
{ "message": "Talebiniz firmaya iletildi.", "data": { "...talep nesnesi..." } }
```

**Hatalar** (kontrol sırasıyla)
| Kod | Durum |
|-----|-------|
| 400 | Eksik alan, yanlış tür, geçmiş/geçersiz tarih, geçersiz `priority` |
| 422 | `budget` 1000 TL'nin altında |
| 404 | `vendorId` ile mekan bulunamadı |
| 422 | `guestCount` mekan kapasitesini aşıyor |
| 409 | Aynı müşterinin aynı mekana zaten bekleyen talebi var |
| 409 | Mekan seçilen tarih için zaten `Anlaşıldı` durumunda başka bir talebe ayrılmış |

### `GET /tasks`
Tüm talepleri listeler.

| Query | Açıklama |
|-------|----------|
| `status` | Duruma göre filtre |
| `priority` | Önceliğe göre filtre |
| `vendorId` | Mekana göre filtre |
| `sort` | `id`, `createdAt`, `eventDate`, `budget`, `guestCount` |
| `order` | `asc` (varsayılan) veya `desc` |
| `page`, `limit` | Sayfalama |

**Örnek:** `GET /tasks?status=Anlaşıldı&sort=budget&order=desc&page=1&limit=10`

**200 OK**
```json
{ "total": 1, "data": [ { "...talep nesnesi..." } ] }
```
Geçersiz `status`, `priority`, `sort` veya `page/limit` için `400` döner.
### `GET /tasks/search?keyword=`
Müşteri adı, mekan adı, durum veya önceliğe göre arama yapar (büyük/küçük harf duyarsız). `page` ve `limit` da desteklenir. `keyword` yoksa `400` döner.
**Örnek:** `GET /tasks/search?keyword=arya` → `200 OK`, `{ "total": 1, "data": [ ... ] }`

### `GET /tasks/search?keyword=`
Müşteri adı, mekan adı, durum veya önceliğe göre arama yapar (büyük/küçük harf duyarsız). `page` ve `limit` da desteklenir. `keyword` gönderilmezse `400` döner.

**Örnek:** `GET /tasks/search?keyword=arya`

**200 OK**
```json
{ "total": 1, "data": [ { "...talep nesnesi..." } ] }
```

### `GET /tasks/:id`
Talep detayını getirir. `200 OK` ile talep nesnesi, bulunamazsa `404`, id sayı değilse `400`.

### `GET /tasks/customer/:customerName`
Bir müşterinin tüm taleplerini dizi olarak döner (büyük/küçük harf duyarsız). **Örnek:** `GET /tasks/customer/arya`

### `GET /tasks/vendor/:vendorId`
Bir firmaya gelen tüm talepleri dizi olarak döner. Mekan yoksa `404`.

### `PATCH /tasks/:id`
Talebi kısmen günceller. Sadece gönderilen alanlar değişir.

**Güncellenebilir alanlar:** `status`, `priority`, `eventDate`, `guestCount`, `budget`
**Değiştirilemez alanlar:** `id`, `vendorId`, `customerName`, `createdAt` (gönderilirse `400`)

**Body örneği**
```json
{ "status": "Anlaşıldı" }
```

**200 OK**
```json
{ "message": "Talebiniz güncellendi.", "data": { "...güncel talep nesnesi..." } }
```
Durum değiştiğinde `statusHistory`'ye yeni kayıt eklenir ve `updatedAt` yenilenir.

**Hatalar**
| Kod | Durum |
|-----|-------|
| 400 | Hiç güncellenebilir alan yok, değiştirilemez alan gönderildi, geçersiz değer |
| 404 | Talep bulunamadı |
| 422 | Bütçe 1000 TL altı veya davetli sayısı kapasiteyi aşıyor |
| 409 | `Anlaşıldı` yapılmak istenen talep için mekan o tarihte başka bir talepte zaten kesinleşmiş |

### `DELETE /tasks/:id`
Talebi kalıcı olarak siler.

**200 OK**
```json
{ "message": "Talep silindi.", "data": { "...silinen talep..." } }
```
Bulunamazsa `404`.

---

## 3. Reports (Raporlama)

### `GET /reports/summary`
**200 OK**
```json
{
  "totalRequests": 2,
  "pendingRequests": 1,
  "completedRequests": 1,
  "rejectedRequests": 0,
  "totalBudgetVolume": 200000,
  "agreedBudgetVolume": 50000
}
```
* `pendingRequests`: `Fiyat Bekleniyor`, `completedRequests`: `Anlaşıldı`, `rejectedRequests`: `Reddedildi`
* `totalBudgetVolume`: tüm taleplerin bütçe toplamı, `agreedBudgetVolume`: yalnızca anlaşılanların toplamı

### `GET /reports/completed`
```json
{ "completedRequests": 1 }
```

### `GET /reports/pending`
```json
{ "pendingRequests": 1 }
```

---

## 4. Loglama
Her istek konsola şu biçimde yazılır (Türkiye saati):
```
[28.09.2026 15:31:21] POST /tasks -> 201 (4 ms)
```
