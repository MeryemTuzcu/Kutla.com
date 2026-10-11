// Sadece rakamlardan oluşan, güvenli bir tam sayı ise sayıya çevirir; değilse null döner.
// ("abc", "1e2", "0x10", " ", "1.5" gibi değerler artık geçersiz sayılır.)
const parseId = (value) => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
};

// Sorgu parametresini sayıya çevirir; boş, dizi veya sayı olmayan değerde NaN döner.
const parseNumber = (value) => {
    if (typeof value !== 'string' || value.trim() === '') return NaN;
    return Number(value);
};

module.exports = { parseId, parseNumber };