const express = require('express');
const router = express.Router();
const { createRating, getUserRatings } = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createRating);
router.get('/user/:userId', getUserRatings);

module.exports = router;
