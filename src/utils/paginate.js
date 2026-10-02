// page ve limit verilmediyse tüm liste döner; verildiyse sayfalanır.
// total her zaman FİLTRELENMİŞ toplam kayıt sayısıdır (sayfadaki sayı değil).
const paginate = (items, query) => {
    const total = items.length;
    const { page, limit } = query;

    if (page === undefined && limit === undefined) {
        return { body: { total, data: items } };
    }

    const p = page === undefined ? 1 : Number(page);
    const l = limit === undefined ? 10 : Number(limit);

    if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 100) {
        return { error: "page ve limit pozitif tam sayı olmalıdır (limit en fazla 100)." };
    }

    const start = (p - 1) * l;
    return {
        body: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
            data: items.slice(start, start + l)
        }
    };
};

module.exports = { paginate };
