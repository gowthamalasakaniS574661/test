const express = require('express');
const router = express.Router();
const { getTrustScore, getMyTrustScore, recalculate } = require('../controllers/trustScoreController');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, getMyTrustScore);
router.post('/recalculate', authenticate, recalculate);
router.get('/:userId', getTrustScore);

module.exports = router;
