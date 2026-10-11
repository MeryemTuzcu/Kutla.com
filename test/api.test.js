// Çalıştırmak için: npm test  (Node.js 18+ gerekir, ek paket kurmaya gerek yok)
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let base;

before(() => {
    server = app.listen(0);
    base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const call = async (method, path, body, rawBody) => {
    const res = await fetch(base + path, {
        method,
        headers: body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined)
    });
    return { status: res.status, headers: res.headers, json: await res.json().catch(() => null) };
};

// Tarihler her zaman "bugünden ~1 yıl sonra" hesaplanır; testler yıllar geçse de bozulmaz.
const futureDate = (extraDays = 0) => new Date(Date.now() + (400 + extraDays) * 86400000).toISOString().slice(0, 10);
const validTask = { vendorId: 4, customerName: 'Test Müşteri', eventDate: futureDate(), guestCount: 100, budget: 50000 };

describe('Görev (Task) CRUD', () => {
    let createdId;

    it('GET /tasks tüm görevleri listeler', async () => {
        const r = await call('GET', '/tasks');
        assert.equal(r.status, 200);
        assert.equal(r.json.total, 4);
    });

    it('POST /tasks yeni görev oluşturur (201)', async () => {
        const r = await call('POST', '/tasks', validTask);
        assert.equal(r.status, 201);
        assert.equal(r.json.data.status, 'Fiyat Bekleniyor');
        assert.equal(r.json.data.priority, 'Orta');
        createdId = r.json.data.id;
    });

    it('GET /tasks/:id detayı getirir', async () => {
        const r = await call('GET', `/tasks/${createdId}`);
        assert.equal(r.status, 200);
        assert.equal(r.json.customerName, 'Test Müşteri');
    });

    it('PATCH /tasks/:id durumu günceller ve geçmişe kayıt ekler', async () => {
        const r = await call('PATCH', `/tasks/${createdId}`, { status: 'Anlaşıldı' });
        assert.equal(r.status, 200);
        assert.equal(r.json.data.statusHistory.length, 2);
    });

    it('DELETE /tasks/:id siler, sonra 404 döner', async () => {
        assert.equal((await call('DELETE', `/tasks/${createdId}`)).status, 200);
        assert.equal((await call('GET', `/tasks/${createdId}`)).status, 404);
    });

    it('silinen görevin id\'si tekrar kullanılmaz', async () => {
        const r = await call('POST', '/tasks', { ...validTask, customerName: 'Başka Müşteri' });
        assert.ok(r.json.data.id > createdId);
        await call('DELETE', `/tasks/${r.json.data.id}`);
    });
});

describe('Doğrulama ve iş kuralları', () => {
    it('eksik alan → 400', async () => {
        const r = await call('POST', '/tasks', { vendorId: 2, customerName: 'Ahmet', eventDate: '2027-12-10' });
        assert.equal(r.status, 400);
    });

    it('bütçe metin olarak gönderilirse → 400', async () => {
        const r = await call('POST', '/tasks', { ...validTask, budget: 'abc' });
        assert.equal(r.status, 400);
    });

    it('geçmiş tarih → 400', async () => {
        const r = await call('POST', '/tasks', { ...validTask, eventDate: '2020-01-01' });
        assert.equal(r.status, 400);
    });

    it('çok uzun isim → 400', async () => {
        const r = await call('POST', '/tasks', { ...validTask, customerName: 'A'.repeat(101) });
        assert.equal(r.status, 400);
    });

    it('1000 TL altı bütçe → 422', async () => {
        const r = await call('POST', '/tasks', { ...validTask, budget: 800 });
        assert.equal(r.status, 422);
    });

    it('kapasite aşımı → 422', async () => {
        const r = await call('POST', '/tasks', { ...validTask, vendorId: 6, guestCount: 300 });
        assert.equal(r.status, 422);
    });

    it('olmayan mekan → 404', async () => {
        const r = await call('POST', '/tasks', { ...validTask, vendorId: 999 });
        assert.equal(r.status, 404);
    });

    it('aynı müşteri aynı mekana ikinci bekleyen talep → 409', async () => {
        const first = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Mükerrer Müşteri' });
        assert.equal(first.status, 201);
        const second = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Mükerrer Müşteri' });
        assert.equal(second.status, 409);
        await call('DELETE', `/tasks/${first.json.data.id}`);
    });

    it('anlaşılmış mekan + tarih için yeni talep → 409 (çifte rezervasyon)', async () => {
        const date = futureDate(10);
        const a = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Rezervasyon A', eventDate: date });
        await call('PATCH', `/tasks/${a.json.data.id}`, { status: 'Anlaşıldı' });
        const b = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Rezervasyon B', eventDate: date });
        assert.equal(b.status, 409);
        await call('DELETE', `/tasks/${a.json.data.id}`);
    });

    it('aynı tarihte ikinci talebi onaylamaya çalışmak → 409', async () => {
        const date = futureDate(20);
        const a = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Onay A', eventDate: date });
        const b = await call('POST', '/tasks', { ...validTask, vendorId: 5, customerName: 'Onay B', eventDate: date });
        assert.equal((await call('PATCH', `/tasks/${a.json.data.id}`, { status: 'Anlaşıldı' })).status, 200);
        assert.equal((await call('PATCH', `/tasks/${b.json.data.id}`, { status: 'Anlaşıldı' })).status, 409);
        await call('DELETE', `/tasks/${a.json.data.id}`);
        await call('DELETE', `/tasks/${b.json.data.id}`);
    });

    it('geçersiz status ile güncelleme → 400', async () => {
        const r = await call('PATCH', '/tasks/1', { status: 'Bitti' });
        assert.equal(r.status, 400);
    });

    it('değiştirilemez alan → 400 (tek başına ve başka alanla birlikte)', async () => {
        assert.equal((await call('PATCH', '/tasks/1', { customerName: 'Ayşe' })).status, 400);
        const mixed = await call('PATCH', '/tasks/1', { customerName: 'Ayşe', priority: 'Düşük' });
        assert.equal(mixed.status, 400);
        assert.equal((await call('GET', '/tasks/1')).json.priority, 'Orta'); // hiçbir alan değişmedi
    });
});

describe('Sorgu, arama ve sayfalama', () => {
    it('durum ve öncelik filtresi', async () => {
        assert.equal((await call('GET', '/tasks?status=' + encodeURIComponent('Anlaşıldı'))).json.total, 1);
        assert.equal((await call('GET', '/tasks?priority=Orta')).json.total, 2);
    });

    it('geçersiz filtre / sıralama değerleri → 400', async () => {
        assert.equal((await call('GET', '/tasks?status=Bitti')).status, 400);
        assert.equal((await call('GET', '/tasks?sort=foo')).status, 400);
        assert.equal((await call('GET', '/tasks?sort=budget&order=xyz')).status, 400);
    });

    it('sayfalama toplam kayıt sayısını doğru verir', async () => {
        const r = await call('GET', '/tasks?page=1&limit=2');
        assert.equal(r.json.total, 4);
        assert.equal(r.json.totalPages, 2);
        assert.equal(r.json.data.length, 2);
    });

    it('bütçeye göre azalan sıralama', async () => {
        const r = await call('GET', '/tasks?sort=budget&order=desc');
        assert.deepEqual(r.json.data.map((t) => t.id), [1, 4, 2, 3]);
    });

    it('arama büyük/küçük harf duyarsız, keyword zorunlu', async () => {
        assert.equal((await call('GET', '/tasks/search?keyword=ARYA')).json.total, 1);
        assert.equal((await call('GET', '/tasks/search')).status, 400);
    });

    it('müşteri ve firma bazlı listeleme', async () => {
        assert.equal((await call('GET', '/tasks/customer/zeynep')).json.length, 1);
        assert.equal((await call('GET', '/tasks/vendor/1')).json.length, 2);
        assert.equal((await call('GET', '/tasks/vendor/999')).status, 404);
    });

    it('mekan filtreleri ve sayfalama', async () => {
        const a = await call('GET', '/vendors?category=' + encodeURIComponent('Düğün') + '&district=' + encodeURIComponent('Sarıyer'));
        assert.equal(a.json.total, 2);
        const b = await call('GET', '/vendors?maxBudget=130000&minCapacity=200');
        assert.deepEqual(b.json.data.map((v) => v.id), [4, 8, 13]);
        assert.equal((await call('GET', '/vendors?maxBudget=')).status, 400);
    });
});

describe('Rapor servisleri', () => {
    it('özet, tamamlanan ve bekleyen sayıları tutarlı', async () => {
        const s = (await call('GET', '/reports/summary')).json;
        assert.equal(s.totalRequests, s.pendingRequests + s.completedRequests + s.rejectedRequests);
        assert.equal((await call('GET', '/reports/completed')).json.completedRequests, s.completedRequests);
        assert.equal((await call('GET', '/reports/pending')).json.pendingRequests, s.pendingRequests);
    });
});

describe('Hata yönetimi ve güvenlik', () => {
    it('id sayı değilse 400 (görev ve mekan için aynı davranış)', async () => {
        assert.equal((await call('GET', '/tasks/abc')).status, 400);
        assert.equal((await call('GET', '/tasks/1e2')).status, 400);
        assert.equal((await call('GET', '/vendors/abc')).status, 400);
        assert.equal((await call('GET', '/vendors/999')).status, 404);
    });

    it('bozuk JSON → 400, çok büyük gövde → 413', async () => {
        assert.equal((await call('POST', '/tasks', undefined, '{ "vendorId": 1,')).status, 400);
        const big = await call('POST', '/tasks', undefined, JSON.stringify({ x: 'a'.repeat(20000) }));
        assert.equal(big.status, 413);
    });

    it('tanımsız yol → 404 JSON', async () => {
        const r = await call('GET', '/yok');
        assert.equal(r.status, 404);
        assert.equal(r.json.error, 'Not Found');
    });

    it('X-Powered-By başlığı gönderilmez', async () => {
        const r = await call('GET', '/');
        assert.equal(r.headers.get('x-powered-by'), null);
    });
});