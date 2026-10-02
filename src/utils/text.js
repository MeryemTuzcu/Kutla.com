// Türkçe karakterlere duyarlı, büyük/küçük harf farkını yok sayan karşılaştırma
const sameText = (a, b) =>
    String(a).trim().toLocaleLowerCase('tr-TR') === String(b).trim().toLocaleLowerCase('tr-TR');

module.exports = { sameText };
