const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');

router.get('/', authenticate, getMyNotifications);
router.post('/:id/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllRead);

module.exports = router;
