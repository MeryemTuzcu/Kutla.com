const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const vendorRoutes = require('./routes/vendorRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors()); // React bağlantısında port engeline takılmamak için
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => {
    res.status(200).json({ message: "Kutla.com B2C Organizasyon API Sistemine Hoş Geldiniz!" });
});

app.use('/vendors', vendorRoutes);
app.use('/tasks', taskRoutes);
app.use('/reports', reportRoutes);

// 404: Tanımsız endpoint
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `${req.method} ${req.originalUrl} adresi bulunamadı.`
    });
});

// GLOBAL ERROR HANDLER — tüm route'ların en altında olmalı
app.use((err, req, res, next) => {
    // Bozuk JSON gönderildiğinde 500 yerine 400 dön
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: "Bad Request",
            message: "İstek gövdesi geçerli bir JSON değil."
        });
    }

    console.error(`[Sistem Hatası] ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}:`, err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: "Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    });
});

module.exports = app;
