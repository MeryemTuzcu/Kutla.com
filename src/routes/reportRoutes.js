const express = require('express');
const router = express.Router();
const { getSystemSummary, getCompleted, getPending } = require('../controllers/reportController');

router.get('/summary', getSystemSummary);
router.get('/completed', getCompleted);
router.get('/pending', getPending);

module.exports = router;
