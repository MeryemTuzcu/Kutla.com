const { STATUSES, PRIORITIES } = require('../data/database');
const { sendError } = require('../utils/respond');

const bad = (res, message) => sendError(res, 400, "Bad Request", message);

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const isPositiveInt = (v) => Number.isInteger(v) && v > 0;
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const todayTR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }); // YYYY-MM-DD

// "YYYY-MM-DD" biçiminde ve gerçekten var olan bir tarih mi? (örn. 2027-02-31 geçersiz)
const isValidDate = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};

// Alan bazlı tür/biçim kontrolleri. Hata varsa mesaj döner, yoksa null.
const checkers = {
    vendorId: (v) => isPositiveInt(v) ? null : "vendorId pozitif bir tam sayı olmalıdır.",
    customerName: (v) => (typeof v === 'string' && v.trim().length >= 2) ? null : "customerName en az 2 karakterlik bir metin olmalıdır.",
    eventDate: (v) => {
        if (!isValidDate(v)) return "eventDate YYYY-AA-GG biçiminde geçerli bir tarih olmalıdır (örn. 2027-06-15).";
        if (v < todayTR()) return "eventDate geçmiş bir tarih olamaz.";
        return null;
    },
    guestCount: (v) => isPositiveInt(v) ? null : "guestCount pozitif bir tam sayı olmalıdır.",
    budget: (v) => isNumber(v) ? null : "budget sayı olmalıdır (tırnak içinde metin olarak değil).",
    status: (v) => STATUSES.includes(v) ? null : `status geçersiz. Geçerli değerler: ${STATUSES.join(', ')}.`,
    priority: (v) => PRIORITIES.includes(v) ? null : `priority geçersiz. Geçerli değerler: ${PRIORITIES.join(', ')}.`
};

// POST /tasks
const validateCreateTask = (req, res, next) => {
    const body = req.body || {};
    const required = ['vendorId', 'customerName', 'eventDate', 'guestCount', 'budget'];

    const missing = required.filter((k) => isBlank(body[k]));
    if (missing.length) {
        return bad(res, `Eksik alan(lar): ${missing.join(', ')}. Tüm alanlar (vendorId, customerName, eventDate, guestCount, budget) doldurulmalıdır.`);
    }

    const fields = body.priority !== undefined ? [...required, 'priority'] : required;
    const errors = fields.map((k) => checkers[k](body[k])).filter(Boolean);
    if (errors.length) return bad(res, errors.join(' '));

    next();
};

// PATCH /tasks/:id  (kısmi güncelleme: sadece gönderilen alanlar değişir)
const PATCHABLE = ['status', 'priority', 'eventDate', 'guestCount', 'budget'];

const validatePatchTask = (req, res, next) => {
    const body = req.body || {};
    const present = PATCHABLE.filter((k) => body[k] !== undefined);

    if (!present.length) {
        return bad(res, `En az bir alan göndermelisiniz. Güncellenebilir alanlar: ${PATCHABLE.join(', ')}.`);
    }

    const errors = present.map((k) => checkers[k](body[k])).filter(Boolean);
    if (errors.length) return bad(res, errors.join(' '));

    next();
};

module.exports = { validateCreateTask, validatePatchTask };
