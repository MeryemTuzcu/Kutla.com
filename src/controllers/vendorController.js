const { vendors } = require('../data/database');
const { sendError } = require('../utils/respond');
const { sameText } = require('../utils/text');
const { paginate } = require('../utils/paginate');

// GET /vendors?category=&district=&maxBudget=&minCapacity=&page=&limit=
const getVendors = (req, res) => {
    const { category, district, maxBudget, minCapacity } = req.query;
    let result = [...vendors];

    if (category) result = result.filter((v) => sameText(v.category, category));
    if (district) result = result.filter((v) => sameText(v.district, district));

    if (maxBudget !== undefined) {
        const n = Number(maxBudget);
        if (!Number.isFinite(n)) return sendError(res, 400, "Bad Request", "maxBudget sayı olmalıdır.");
        result = result.filter((v) => v.price <= n);
    }

    if (minCapacity !== undefined) {
        const n = Number(minCapacity);
        if (!Number.isFinite(n)) return sendError(res, 400, "Bad Request", "minCapacity sayı olmalıdır.");
        result = result.filter((v) => v.capacity >= n);
    }

    const page = paginate(result, req.query);
    if (page.error) return sendError(res, 400, "Bad Request", page.error);
    res.status(200).json(page.body);
};

// GET /vendors/:id
const getVendorById = (req, res) => {
    const id = Number(req.params.id);
    const vendor = Number.isInteger(id) ? vendors.find((v) => v.id === id) : null;
    if (!vendor) return sendError(res, 404, "Not Found", "Mekan bulunamadı.");
    res.status(200).json(vendor);
};

module.exports = { getVendors, getVendorById };
