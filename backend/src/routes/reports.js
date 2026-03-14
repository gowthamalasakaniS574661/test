const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createReport, getMyReports } = require('../controllers/reportController');

router.post('/', authenticate, createReport);
router.get('/my', authenticate, getMyReports);

module.exports = router;
