const STATUSES = ["Fiyat Bekleniyor", "Anlaşıldı", "Reddedildi"];
const PRIORITIES = ["Düşük", "Orta", "Yüksek"];
const MIN_BUDGET = 1000;

const vendors = [
    { id: 1, name: "Fındıksuyu Cam Bahçe", category: "Düğün", district: "Sarıyer", capacity: 400, price: 150000 },
    { id: 2, name: "Sait Halim Paşa Yalısı", category: "Düğün", district: "Sarıyer", capacity: 500, price: 350000 },
    { id: 3, name: "Çubuklu Hayal Kahvesi", category: "Düğün", district: "Beykoz", capacity: 300, price: 200000 },
    { id: 4, name: "Moda Teras", category: "Düğün", district: "Kadıköy", capacity: 250, price: 120000 },
    { id: 5, name: "Cemile Sultan Korusu", category: "Düğün", district: "Üsküdar", capacity: 600, price: 250000 },

    { id: 6, name: "Thevent Söz/Nişan Evi", category: "Nişan", district: "Sarıyer", capacity: 100, price: 50000 },
    { id: 7, name: "Qubbe İstanbul", category: "Nişan", district: "Sarıyer", capacity: 150, price: 80000 },
    { id: 8, name: "Mihrabat Korusu", category: "Nişan", district: "Beykoz", capacity: 200, price: 90000 },
    { id: 9, name: "Feriye Sarayı", category: "Nişan", district: "Beşiktaş", capacity: 120, price: 120000 },
    { id: 10, name: "Kız Kulesi (Özel Oda)", category: "Nişan", district: "Üsküdar", capacity: 50, price: 70000 },

    { id: 11, name: "Frankie İstanbul", category: "İş Yemeği", district: "Şişli", capacity: 80, price: 40000 },
    { id: 12, name: "Sunset Grill & Bar", category: "İş Yemeği", district: "Beşiktaş", capacity: 100, price: 60000 },
    { id: 13, name: "Oligark", category: "Doğum Günü", district: "Beşiktaş", capacity: 300, price: 100000 },
    { id: 14, name: "Monkey İstanbul", category: "Doğum Günü", district: "Beyoğlu", capacity: 150, price: 45000 },
    { id: 15, name: "Spago by Wolfgang Puck", category: "Yılbaşı", district: "Şişli", capacity: 200, price: 150000 }
];

const seedTime = new Date().toISOString();

const tasks = [
    {
        id: 1,
        vendorId: 1,
        customerName: "Berfin",
        eventDate: "2027-06-15",
        guestCount: 350,
        budget: 150000,
        priority: "Orta",
        status: "Fiyat Bekleniyor",
        statusHistory: [{ status: "Fiyat Bekleniyor", changedAt: seedTime }],
        createdAt: seedTime,
        updatedAt: seedTime
    },
    {
        id: 2,
        vendorId: 3,
        customerName: "Arya",
        eventDate: "2027-09-14",
        guestCount: 150,
        budget: 80000,
        priority: "Yüksek",
        status: "Anlaşıldı",
        statusHistory: [{ status: "Anlaşıldı", changedAt: seedTime }],
        createdAt: seedTime,
        updatedAt: seedTime
    },
    {
        id: 3,
        vendorId: 6,
        customerName: "Zeynep",
        eventDate: "2027-03-10",
        guestCount: 80,
        budget: 45000,
        priority: "Düşük",
        status: "Reddedildi",
        statusHistory: [{ status: "Reddedildi", changedAt: seedTime }],
        createdAt: seedTime,
        updatedAt: seedTime
    },
    {
        id: 4,
        vendorId: 1,
        customerName: "Deniz",
        eventDate: "2027-08-20",
        guestCount: 300,
        budget: 140000,
        priority: "Orta",
        status: "Fiyat Bekleniyor",
        statusHistory: [{ status: "Fiyat Bekleniyor", changedAt: seedTime }],
        createdAt: seedTime,
        updatedAt: seedTime
    }
];

// Silinen kayıtların id'si tekrar kullanılmasın diye ayrı sayaç
let lastTaskId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
const getNextTaskId = () => ++lastTaskId;

module.exports = { vendors, tasks, STATUSES, PRIORITIES, MIN_BUDGET, getNextTaskId };