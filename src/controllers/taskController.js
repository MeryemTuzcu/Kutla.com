const { tasks, vendors, STATUSES, PRIORITIES, MIN_BUDGET, getNextTaskId } = require('../data/database');
const { sendError } = require('../utils/respond');
const { sameText } = require('../utils/text');
const { paginate } = require('../utils/paginate');

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
};

const badRequest = (res, message) => sendError(res, 400, "Bad Request", message);
const notFound = (res, message) => sendError(res, 404, "Not Found", message);

// GET /tasks  — filtre: status, priority, vendorId | sıralama: sort, order | sayfalama: page, limit
const getAllTasks = (req, res) => {
    const { status, priority, vendorId, sort, order } = req.query;
    let result = [...tasks];

    if (status !== undefined) {
        if (!STATUSES.includes(status)) return badRequest(res, `Geçersiz status. Geçerli değerler: ${STATUSES.join(', ')}.`);
        result = result.filter((t) => t.status === status);
    }

    if (priority !== undefined) {
        if (!PRIORITIES.includes(priority)) return badRequest(res, `Geçersiz priority. Geçerli değerler: ${PRIORITIES.join(', ')}.`);
        result = result.filter((t) => t.priority === priority);
    }

    if (vendorId !== undefined) {
        const id = parseId(vendorId);
        if (id === null) return badRequest(res, "vendorId tam sayı olmalıdır.");
        result = result.filter((t) => t.vendorId === id);
    }

    if (sort !== undefined) {
        const SORTABLE = ['id', 'createdAt', 'eventDate', 'budget', 'guestCount'];
        if (!SORTABLE.includes(sort)) return badRequest(res, `Geçersiz sort. Geçerli değerler: ${SORTABLE.join(', ')}.`);
        const dir = order === 'desc' ? -1 : 1;
        result.sort((a, b) => (a[sort] > b[sort] ? dir : a[sort] < b[sort] ? -dir : 0));
    }

    const page = paginate(result, req.query);
    if (page.error) return badRequest(res, page.error);
    res.status(200).json(page.body);
};
// GET /tasks/search?keyword=arya — müşteri adı, mekan adı, durum veya önceliğe göre arama
const searchTasks = (req, res) => {
    const keyword = String(req.query.keyword || '').trim();
    if (!keyword) {
        return badRequest(res, "keyword parametresi zorunludur. Örn: /tasks/search?keyword=arya");
    }

    const k = keyword.toLocaleLowerCase('tr-TR');
    const result = tasks.filter((t) => {
        const vendor = vendors.find((v) => v.id === t.vendorId);
        return [t.customerName, t.status, t.priority, vendor ? vendor.name : '']
            .some((field) => String(field).toLocaleLowerCase('tr-TR').includes(k));
    });

    const page = paginate(result, req.query);
    if (page.error) return badRequest(res, page.error);
    res.status(200).json(page.body);
};

// GET /tasks/customer/:customerName
const getCustomerTasks = (req, res) => {
    const result = tasks.filter((t) => sameText(t.customerName, req.params.customerName));
    res.status(200).json(result);
};

// GET /tasks/vendor/:vendorId  — firmanın kendisine gelen talepler
const getVendorTasks = (req, res) => {
    const vendorId = parseId(req.params.vendorId);
    if (vendorId === null) return badRequest(res, "vendorId tam sayı olmalıdır.");
    if (!vendors.some((v) => v.id === vendorId)) return notFound(res, "Mekan bulunamadı.");

    res.status(200).json(tasks.filter((t) => t.vendorId === vendorId));
};

// GET /tasks/:id
const getTaskById = (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return badRequest(res, "id tam sayı olmalıdır.");

    const task = tasks.find((t) => t.id === id);
    if (!task) return notFound(res, "Talep bulunamadı.");
    res.status(200).json(task);
};

// POST /tasks
const createTask = (req, res) => {
    // Alanlar validator'da doğrulandı; sadece izin verilenleri alıyoruz (mass assignment engeli)
    const { vendorId, eventDate, guestCount, budget, priority } = req.body;
    const customerName = req.body.customerName.trim();

    // 422: iş kuralı — bütçe alt sınırı
    if (budget < MIN_BUDGET) {
        return sendError(res, 422, "Unprocessable Entity",
            `Sistem politikaları gereği ${MIN_BUDGET} TL altı bütçeli talepler firmalara iletilemez.`);
    }

    // 404: mekan var mı?
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return notFound(res, "Belirtilen mekan bulunamadı.");

    // 422: kapasite aşımı
    if (guestCount > vendor.capacity) {
        return sendError(res, 422, "Unprocessable Entity",
            `Davetli sayısı mekan kapasitesini (${vendor.capacity}) aşıyor.`);
    }

    // 409: aynı müşteri aynı mekana zaten bekleyen talep göndermiş
    const duplicate = tasks.find((t) =>
        t.vendorId === vendorId &&
        sameText(t.customerName, customerName) &&
        t.status === "Fiyat Bekleniyor"
    );
    if (duplicate) {
        return sendError(res, 409, "Conflict", "Bu mekan için zaten yanıt bekleyen bir talebiniz bulunuyor.");
    }

    // 409: mekan o tarihte başka bir talep için kesinleşmiş (çift rezervasyon engeli)
    const dateTaken = tasks.find((t) =>
        t.vendorId === vendorId && t.eventDate === eventDate && t.status === "Anlaşıldı"
    );
    if (dateTaken) {
        return sendError(res, 409, "Conflict", "Bu mekan seçilen tarih için zaten dolu.");
    }

    const now = new Date().toISOString();
    const newTask = {
        id: getNextTaskId(),
        vendorId,
        customerName,
        eventDate,
        guestCount,
        budget,
        priority: priority || "Orta",
        status: "Fiyat Bekleniyor",
        statusHistory: [{ status: "Fiyat Bekleniyor", changedAt: now }],
        createdAt: now,
        updatedAt: now
    };

    tasks.push(newTask);
    res.status(201).json({ message: "Talebiniz firmaya iletildi.", data: newTask });
};

// PATCH /tasks/:id — kısmi güncelleme (status, priority, eventDate, guestCount, budget)
const updateTask = (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return badRequest(res, "id tam sayı olmalıdır.");

    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return notFound(res, "Talep bulunamadı.");

    const current = tasks[index];
    const { status, priority, eventDate, guestCount, budget } = req.body;

    const changes = {};
    if (status !== undefined) changes.status = status;
    if (priority !== undefined) changes.priority = priority;
    if (eventDate !== undefined) changes.eventDate = eventDate;
    if (guestCount !== undefined) changes.guestCount = guestCount;
    if (budget !== undefined) changes.budget = budget;

    const next = { ...current, ...changes };

    if (changes.budget !== undefined && next.budget < MIN_BUDGET) {
        return sendError(res, 422, "Unprocessable Entity",
            `Bütçe ${MIN_BUDGET} TL'nin altında olamaz.`);
    }

    const vendor = vendors.find((v) => v.id === next.vendorId);
    if (changes.guestCount !== undefined && vendor && next.guestCount > vendor.capacity) {
        return sendError(res, 422, "Unprocessable Entity",
            `Davetli sayısı mekan kapasitesini (${vendor.capacity}) aşıyor.`);
    }

    // Çift rezervasyon: aynı mekan + aynı tarih için ikinci bir "Anlaşıldı" olamaz
    if (next.status === "Anlaşıldı") {
        const clash = tasks.find((t) =>
            t.id !== current.id &&
            t.vendorId === next.vendorId &&
            t.eventDate === next.eventDate &&
            t.status === "Anlaşıldı"
        );
        if (clash) {
            return sendError(res, 409, "Conflict", "Bu mekan seçilen tarih için başka bir taleple zaten kesinleşmiş.");
        }
    }

    const now = new Date().toISOString();
    if (changes.status !== undefined && changes.status !== current.status) {
        next.statusHistory = [...current.statusHistory, { status: changes.status, changedAt: now }];
    }
    next.updatedAt = now;

    tasks[index] = next;
    res.status(200).json({ message: "Talebiniz güncellendi.", data: next });
};

// DELETE /tasks/:id
const deleteTask = (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return badRequest(res, "id tam sayı olmalıdır.");

    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return notFound(res, "Talep bulunamadı.");

    const [deleted] = tasks.splice(index, 1);
    res.status(200).json({ message: "Talep silindi.", data: deleted });
};

module.exports = {
    getAllTasks, getCustomerTasks, getVendorTasks, getTaskById, createTask, updateTask, deleteTask, searchTasks
};
