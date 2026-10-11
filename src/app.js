const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const vendorRoutes = require('./routes/vendorRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.disable('x-powered-by'); // sunucu teknolojisini gereksiz yere ifşa etme
app.use(cors()); // React bağlantısında port engeline takılmamak için
app.use(express.json({ limit: '10kb' })); // bu API'de en büyük istek bile birkaç yüz bayttır
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
    if (res.headersSent) return next(err);

    // Bozuk JSON gönderildiğinde 500 yerine 400 dön
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: "Bad Request",
            message: "İstek gövdesi geçerli bir JSON değil."
        });
    }

    // Çok büyük gövde: istemci hatasıdır, 500 değil 413 dönmeli
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: "Payload Too Large",
            message: "İstek gövdesi çok büyük (en fazla 10 KB)."
        });
    }

    // Gövde ayrıştırıcısının diğer istemci hataları (desteklenmeyen karakter kodlaması vb.)
    const status = err.status || err.statusCode;
    if (status >= 400 && status < 500) {
        return res.status(status).json({
            error: "Bad Request",
            message: "İstek işlenemedi. Gönderdiğiniz veriyi kontrol edin."
        });
    }

    console.error(`[Sistem Hatası] ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}:`, err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: "Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    });
});

module.exports = app;