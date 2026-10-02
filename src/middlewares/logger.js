// Tüm isteklerin method, endpoint ve zaman damgasını (ayrıca durum kodu ve süreyi) kaydeder.
const logger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    res.on('finish', () => {
        console.log(`[${timestamp}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
    });

    next();
};

module.exports = logger;