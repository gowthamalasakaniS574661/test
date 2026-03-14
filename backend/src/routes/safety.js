const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getMyDocuments,
  deleteDocument,
  submitIdVerification,
  getVerificationStatus,
  triggerSOS,
  resolveAlert,
  getMyAlerts,
  setEmergencyContacts,
  getEmergencyContacts,
  createShareLink,
  getSharedRide,
  getTripHistory,
} = require('../controllers/safetyController');
const { authenticate } = require('../middleware/auth');

// Driver documents
router.post('/documents', authenticate, uploadDocument);
router.get('/documents', authenticate, getMyDocuments);
router.delete('/documents/:id', authenticate, deleteDocument);

// ID verification
router.post('/verify-id', authenticate, submitIdVerification);
router.get('/verify-id/status', authenticate, getVerificationStatus);

// SOS emergency
router.post('/sos', authenticate, triggerSOS);
router.post('/sos/:id/resolve', authenticate, resolveAlert);
router.get('/sos/history', authenticate, getMyAlerts);

// Emergency contacts
router.put('/emergency-contacts', authenticate, setEmergencyContacts);
router.get('/emergency-contacts', authenticate, getEmergencyContacts);

// Ride sharing link
router.post('/share-ride', authenticate, createShareLink);
router.get('/share/:token', getSharedRide);

// Trip history
router.get('/trip-history', authenticate, getTripHistory);

module.exports = router;
