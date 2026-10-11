const app = require('./app');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Kutla.com Backend API ${PORT} portunda çalışıyor...`);
});

// Aynı porta ikinci kez sunucu açılırsa anlaşılır bir mesaj ver
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} zaten kullanımda. Açık olan diğer sunucuyu kapatın veya farklı bir port deneyin (örn. PORT=3001 npm start).`);
        process.exit(1);
    }
    throw err;
});