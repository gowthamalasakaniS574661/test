const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getUsers, suspendUser, unsuspendUser, approveDriver,
  verifyDocument, verifyId, getPendingDocuments, getDashboardStats,
  getReports, resolveReport,
} = require('../controllers/adminController');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.post('/drivers/:id/approve', approveDriver);
router.get('/documents/pending', getPendingDocuments);
router.post('/documents/:id/verify', verifyDocument);
router.post('/id-verifications/:id/verify', verifyId);
router.get('/reports', getReports);
router.post('/reports/:id/resolve', resolveReport);

module.exports = router;
