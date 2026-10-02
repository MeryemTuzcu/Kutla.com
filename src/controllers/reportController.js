const { tasks } = require('../data/database');

const countByStatus = (status) => tasks.filter((t) => t.status === status).length;

const getSystemSummary = (req, res) => {
    const agreed = tasks.filter((t) => t.status === "Anlaşıldı");

    res.status(200).json({
        totalRequests: tasks.length,
        pendingRequests: countByStatus("Fiyat Bekleniyor"),
        completedRequests: agreed.length,
        rejectedRequests: countByStatus("Reddedildi"),
        totalBudgetVolume: tasks.reduce((sum, t) => sum + t.budget, 0),
        agreedBudgetVolume: agreed.reduce((sum, t) => sum + t.budget, 0)
    });
};

// GET /reports/completed
const getCompleted = (req, res) => {
    res.status(200).json({ completedRequests: countByStatus("Anlaşıldı") });
};

// GET /reports/pending
const getPending = (req, res) => {
    res.status(200).json({ pendingRequests: countByStatus("Fiyat Bekleniyor") });
};

module.exports = { getSystemSummary, getCompleted, getPending };