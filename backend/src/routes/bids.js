const express = require('express');
const router = express.Router();
const { createBid, respondToBid, getMyBids, withdrawBid } = require('../controllers/bidController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBidValidation, respondBidValidation } = require('../validators/bids');

router.post('/', authenticate, validate(createBidValidation), createBid);
router.get('/my', authenticate, getMyBids);
router.post('/:id/respond', authenticate, validate(respondBidValidation), respondToBid);
router.post('/:id/withdraw', authenticate, withdrawBid);

module.exports = router;
