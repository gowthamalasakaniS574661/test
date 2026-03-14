const crypto = require('crypto');
const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// ─── DRIVER DOCUMENT UPLOAD ───

const uploadDocument = async (req, res, next) => {
  try {
    const { documentType, fileUrl, fileName, mimeType, expiresAt } = req.body;

    if (req.user.role !== 'driver' && req.user.role !== 'both') {
      throw new AppError('Only drivers can upload documents', 403);
    }

    const validTypes = ['drivers_license', 'vehicle_registration', 'insurance', 'government_id', 'background_check'];
    if (!validTypes.includes(documentType)) {
      throw new AppError(`Invalid document type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    if (!fileUrl) throw new AppError('File URL is required', 400);

    const existing = await query(
      `SELECT id FROM driver_documents
       WHERE user_id = $1 AND document_type = $2 AND status IN ('pending', 'approved')`,
      [req.user.id, documentType]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE driver_documents SET file_url = $1, file_name = $2, mime_type = $3,
         status = 'pending', expires_at = $4, rejection_reason = NULL,
         verified_at = NULL, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [fileUrl, fileName, mimeType, expiresAt || null, existing.rows[0].id]
      );
      const updated = await query('SELECT * FROM driver_documents WHERE id = $1', [existing.rows[0].id]);
      return res.json({ message: 'Document updated', document: formatDocument(updated.rows[0]) });
    }

    const result = await query(
      `INSERT INTO driver_documents (user_id, document_type, file_url, file_name, mime_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, documentType, fileUrl, fileName, mimeType, expiresAt || null]
    );

    res.status(201).json({ message: 'Document uploaded', document: formatDocument(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const getMyDocuments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM driver_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    const requiredTypes = ['drivers_license', 'vehicle_registration', 'insurance'];
    const uploaded = result.rows.map((d) => d.document_type);
    const missing = requiredTypes.filter((t) => !uploaded.includes(t));
    const allApproved = result.rows.length > 0 &&
      requiredTypes.every((t) => result.rows.some((d) => d.document_type === t && d.status === 'approved'));

    res.json({
      documents: result.rows.map(formatDocument),
      requiredTypes,
      missingTypes: missing,
      allApproved,
    });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await query('SELECT * FROM driver_documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) throw new AppError('Document not found', 404);
    if (doc.rows[0].user_id !== req.user.id) throw new AppError('Not authorized', 403);

    await query('DELETE FROM driver_documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── GOVERNMENT ID VERIFICATION ───

const submitIdVerification = async (req, res, next) => {
  try {
    const { idType, documentUrl } = req.body;

    const validTypes = ['passport', 'national_id', 'drivers_license', 'other'];
    if (!validTypes.includes(idType)) {
      throw new AppError(`Invalid ID type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    if (!documentUrl) throw new AppError('Document URL is required', 400);

    const existing = await query(
      `SELECT id, status FROM id_verifications WHERE user_id = $1 AND id_type = $2`,
      [req.user.id, idType]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'verified') {
      throw new AppError('This ID type is already verified', 400);
    }

    await query(
      `INSERT INTO driver_documents (user_id, document_type, file_url, file_name, mime_type)
       VALUES ($1, 'government_id', $2, $3, 'image/jpeg')
       ON CONFLICT DO NOTHING`,
      [req.user.id, documentUrl, `${idType}_verification`]
    );

    let verificationId;
    if (existing.rows.length > 0) {
      await query(
        `UPDATE id_verifications SET status = 'pending', failure_reason = NULL, updated_at = NOW()
         WHERE id = $1`,
        [existing.rows[0].id]
      );
      verificationId = existing.rows[0].id;
    } else {
      const result = await query(
        `INSERT INTO id_verifications (user_id, id_type, status, verification_provider)
         VALUES ($1, $2, 'pending', 'manual') RETURNING id`,
        [req.user.id, idType]
      );
      verificationId = result.rows[0].id;
    }

    // Placeholder: In production, call an external verification service
    // (e.g., Stripe Identity, Onfido, Jumio) and update status asynchronously

    res.status(201).json({
      message: 'ID verification submitted. Review typically takes 1-2 business days.',
      verificationId,
      status: 'pending',
    });
  } catch (err) {
    next(err);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM id_verifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    const userRes = await query('SELECT id_verified FROM users WHERE id = $1', [req.user.id]);

    res.json({
      idVerified: userRes.rows[0]?.id_verified || false,
      verifications: result.rows.map((v) => ({
        id: v.id,
        idType: v.id_type,
        provider: v.verification_provider,
        status: v.status,
        failureReason: v.failure_reason,
        verifiedAt: v.verified_at,
        expiresAt: v.expires_at,
        createdAt: v.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── SOS EMERGENCY ───

const triggerSOS = async (req, res, next) => {
  try {
    const { bookingId, latitude, longitude, message, alertType } = req.body;

    const result = await query(
      `INSERT INTO emergency_alerts (user_id, booking_id, alert_type, latitude, longitude, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, bookingId || null, alertType || 'sos', latitude || null, longitude || null, message || null]
    );

    const alert = result.rows[0];

    // Notify emergency contacts
    const contacts = await query(
      'SELECT * FROM emergency_contacts WHERE user_id = $1',
      [req.user.id]
    );

    if (contacts.rows.length > 0) {
      await query(
        'UPDATE emergency_alerts SET emergency_contacts_notified = TRUE WHERE id = $1',
        [alert.id]
      );
      // Placeholder: Send SMS/push to each contact with location + ride details
    }

    // If there's a booking, also alert the other party
    if (bookingId) {
      const booking = await query(
        `SELECT b.passenger_id, r.driver_id FROM bookings b
         JOIN rides r ON b.ride_id = r.id WHERE b.id = $1`,
        [bookingId]
      );
      if (booking.rows.length > 0) {
        // Placeholder: Notify the driver or passenger
      }
    }

    res.status(201).json({
      message: 'SOS alert triggered. Emergency contacts have been notified.',
      alert: {
        id: alert.id,
        alertType: alert.alert_type,
        status: alert.status,
        contactsNotified: contacts.rows.length,
        createdAt: alert.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const alert = await query('SELECT * FROM emergency_alerts WHERE id = $1', [req.params.id]);
    if (alert.rows.length === 0) throw new AppError('Alert not found', 404);
    if (alert.rows[0].user_id !== req.user.id) throw new AppError('Not authorized', 403);

    await query(
      `UPDATE emergency_alerts SET status = $1, resolved_at = NOW(), resolved_by = $2, updated_at = NOW()
       WHERE id = $3`,
      [req.body.status || 'resolved', req.user.id, req.params.id]
    );

    res.json({ message: 'Alert resolved' });
  } catch (err) {
    next(err);
  }
};

const getMyAlerts = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM emergency_alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    res.json({
      alerts: result.rows.map((a) => ({
        id: a.id,
        bookingId: a.booking_id,
        alertType: a.alert_type,
        latitude: a.latitude,
        longitude: a.longitude,
        message: a.message,
        status: a.status,
        contactsNotified: a.emergency_contacts_notified,
        resolvedAt: a.resolved_at,
        createdAt: a.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── EMERGENCY CONTACTS ───

const setEmergencyContacts = async (req, res, next) => {
  const client = await getClient();
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new AppError('At least one emergency contact is required', 400);
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM emergency_contacts WHERE user_id = $1', [req.user.id]);

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      await client.query(
        `INSERT INTO emergency_contacts (user_id, name, phone, relationship, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, c.name, c.phone, c.relationship || null, i === 0]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Emergency contacts updated', count: contacts.length });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const getEmergencyContacts = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at',
      [req.user.id]
    );
    res.json({
      contacts: result.rows.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        isPrimary: c.is_primary,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── RIDE SHARING LINK ───

const createShareLink = async (req, res, next) => {
  try {
    const { bookingId, recipientName, recipientContact, expiresInHours } = req.body;

    const booking = await query(
      `SELECT b.*, r.driver_id FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE b.id = $1`,
      [bookingId]
    );
    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    const b = booking.rows[0];
    if (b.passenger_id !== req.user.id && b.driver_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 3600000)
      : new Date(Date.now() + 24 * 3600000);

    const result = await query(
      `INSERT INTO ride_share_links (booking_id, user_id, share_token, recipient_name, recipient_contact, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [bookingId, req.user.id, shareToken, recipientName || null, recipientContact || null, expiresAt]
    );

    const shareUrl = `${process.env.APP_URL || 'https://rideshare-marketplace.com'}/track/${shareToken}`;

    res.status(201).json({
      message: 'Share link created',
      shareUrl,
      shareToken,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

const getSharedRide = async (req, res, next) => {
  try {
    const { token } = req.params;

    const link = await query(
      `SELECT sl.*, b.ride_id, b.status as booking_status, b.passenger_id,
              r.origin_address, r.origin_lat, r.origin_lng,
              r.destination_address, r.destination_lat, r.destination_lng,
              r.departure_time, r.status as ride_status,
              d.first_name as driver_first_name, d.last_name as driver_last_name,
              p.first_name as passenger_first_name, p.last_name as passenger_last_name
       FROM ride_share_links sl
       JOIN bookings b ON sl.booking_id = b.id
       JOIN rides r ON b.ride_id = r.id
       JOIN users d ON r.driver_id = d.id
       JOIN users p ON b.passenger_id = p.id
       WHERE sl.share_token = $1`,
      [token]
    );

    if (link.rows.length === 0) throw new AppError('Share link not found', 404);
    const l = link.rows[0];

    if (!l.is_active) throw new AppError('This share link is no longer active', 410);
    if (l.expires_at && new Date(l.expires_at) < new Date()) {
      throw new AppError('This share link has expired', 410);
    }

    await query('UPDATE ride_share_links SET views = views + 1 WHERE id = $1', [l.id]);

    res.json({
      ride: {
        origin: { address: l.origin_address, lat: l.origin_lat, lng: l.origin_lng },
        destination: { address: l.destination_address, lat: l.destination_lat, lng: l.destination_lng },
        departureTime: l.departure_time,
        status: l.ride_status,
        bookingStatus: l.booking_status,
        driver: `${l.driver_first_name} ${l.driver_last_name}`,
        passenger: `${l.passenger_first_name} ${l.passenger_last_name}`,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── TRIP HISTORY ───

const getTripHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const isDriver = req.user.role === 'driver' || req.user.role === 'both';
    const isPassenger = req.user.role === 'passenger' || req.user.role === 'both';

    let whereClause;
    if (isDriver && isPassenger) {
      whereClause = '(r.driver_id = $1 OR b.passenger_id = $1)';
    } else if (isDriver) {
      whereClause = 'r.driver_id = $1';
    } else {
      whereClause = 'b.passenger_id = $1';
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE ${whereClause}`,
      [req.user.id]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const result = await query(
      `SELECT b.id as booking_id, b.seats_booked, b.total_price, b.status as booking_status,
              b.created_at as booked_at,
              r.id as ride_id, r.origin_address, r.origin_lat, r.origin_lng,
              r.destination_address, r.destination_lat, r.destination_lng,
              r.departure_time, r.status as ride_status,
              r.driver_id,
              d.first_name as driver_first_name, d.last_name as driver_last_name,
              d.trust_score as driver_trust_score,
              p.first_name as passenger_first_name, p.last_name as passenger_last_name,
              pay.status as payment_status, pay.amount as payment_amount,
              rat.score as my_rating
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN users d ON r.driver_id = d.id
       JOIN users p ON b.passenger_id = p.id
       LEFT JOIN payments pay ON pay.booking_id = b.id AND pay.status NOT IN ('failed', 'refunded')
       LEFT JOIN ratings rat ON rat.booking_id = b.id AND rat.reviewer_id = $1
       WHERE ${whereClause}
       ORDER BY r.departure_time DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      trips: result.rows.map((t) => ({
        bookingId: t.booking_id,
        rideId: t.ride_id,
        role: t.driver_id === req.user.id ? 'driver' : 'passenger',
        origin: { address: t.origin_address, lat: t.origin_lat, lng: t.origin_lng },
        destination: { address: t.destination_address, lat: t.destination_lat, lng: t.destination_lng },
        departureTime: t.departure_time,
        seatsBooked: t.seats_booked,
        totalPrice: t.total_price,
        bookingStatus: t.booking_status,
        rideStatus: t.ride_status,
        driver: { name: `${t.driver_first_name} ${t.driver_last_name}`, trustScore: t.driver_trust_score },
        passenger: { name: `${t.passenger_first_name} ${t.passenger_last_name}` },
        paymentStatus: t.payment_status || null,
        paymentAmount: t.payment_amount || null,
        myRating: t.my_rating || null,
        bookedAt: t.booked_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

function formatDocument(d) {
  return {
    id: d.id,
    documentType: d.document_type,
    fileUrl: d.file_url,
    fileName: d.file_name,
    mimeType: d.mime_type,
    status: d.status,
    rejectionReason: d.rejection_reason,
    expiresAt: d.expires_at,
    verifiedAt: d.verified_at,
    createdAt: d.created_at,
  };
}

module.exports = {
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
};
