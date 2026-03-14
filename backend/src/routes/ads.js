const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createAd, getAdsForPlacement, recordClick, getAdStats, updateAd } = require('../controllers/adController');

router.get('/', getAdsForPlacement);
router.post('/:id/click', recordClick);

router.post('/', authenticate, createAd);
router.get('/:id/stats', authenticate, getAdStats);
router.put('/:id', authenticate, updateAd);

module.exports = router;
