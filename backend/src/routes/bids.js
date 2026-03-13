const express = require('express');
const router = express.Router();
const {
  createBid, updateBid, respondToBid,
  getBidsForRequest, getMyBids, withdrawBid,
} = require('../controllers/bidController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBidValidation, respondBidValidation, bidIdValidation, updateBidValidation } = require('../validators/bids');

router.post('/', authenticate, validate(createBidValidation), createBid);
router.get('/my', authenticate, getMyBids);
router.get('/request/:requestId', authenticate, getBidsForRequest);
router.put('/:id', authenticate, validate(updateBidValidation), updateBid);
router.post('/:id/respond', authenticate, validate(respondBidValidation), respondToBid);
router.post('/:id/withdraw', authenticate, validate(bidIdValidation), withdrawBid);

module.exports = router;
