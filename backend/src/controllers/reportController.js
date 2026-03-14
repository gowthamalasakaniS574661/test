const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, bookingId, rideId, reason, description, evidenceUrls } = req.body;

    const validReasons = ['harassment', 'unsafe_driving', 'fraud', 'no_show', 'inappropriate', 'spam', 'other'];
    if (!validReasons.includes(reason)) {
      throw new AppError(`Reason must be one of: ${validReasons.join(', ')}`, 400);
    }

    if (reportedUserId === req.user.id) throw new AppError('Cannot report yourself', 400);

    const result = await query(
      `INSERT INTO reports (reporter_id, reported_user_id, booking_id, ride_id, reason, description, evidence_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, reportedUserId || null, bookingId || null, rideId || null,
       reason, description || null, evidenceUrls || null]
    );

    res.status(201).json({ message: 'Report submitted', report: formatReport(result.rows[0]) });
  } catch (err) { next(err); }
};

const getMyReports = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ reports: result.rows.map(formatReport) });
  } catch (err) { next(err); }
};

function formatReport(r) {
  return {
    id: r.id, reportedUserId: r.reported_user_id, bookingId: r.booking_id,
    rideId: r.ride_id, reason: r.reason, description: r.description,
    status: r.status, createdAt: r.created_at,
  };
}

module.exports = { createReport, getMyReports };
