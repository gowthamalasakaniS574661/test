const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { createNotification } = require('../services/notificationService');

const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (role) { where += ` AND u.role = $${idx++}`; values.push(role); }
    if (search) {
      where += ` AND (u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx++})`;
      values.push(`%${search}%`);
    }

    const countRes = await query(`SELECT COUNT(*) FROM users u ${where}`, values);
    values.push(limit, offset);
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.trust_score,
              u.is_verified, u.id_verified, u.is_suspended, u.created_at
       FROM users u ${where}
       ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx}`, values);

    res.json({
      users: result.rows,
      pagination: { page: +page, limit: +limit, total: +countRes.rows[0].count },
    });
  } catch (err) { next(err); }
};

const suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await query(
      `UPDATE users SET is_suspended = TRUE, suspended_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason || 'Suspended by admin', req.params.id]
    );
    await createNotification(req.params.id, 'admin_message', 'Account Suspended', reason || 'Your account has been suspended.');
    res.json({ message: 'User suspended' });
  } catch (err) { next(err); }
};

const unsuspendUser = async (req, res, next) => {
  try {
    await query(
      `UPDATE users SET is_suspended = FALSE, suspended_reason = NULL, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'User unsuspended' });
  } catch (err) { next(err); }
};

const approveDriver = async (req, res, next) => {
  try {
    await query(`UPDATE driver_profiles SET is_approved = TRUE, updated_at = NOW() WHERE user_id = $1`, [req.params.id]);
    await query(`UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await createNotification(req.params.id, 'document_approved', 'Driver Approved', 'Your driver account has been approved!');
    res.json({ message: 'Driver approved' });
  } catch (err) { next(err); }
};

const verifyDocument = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) throw new AppError('Status must be approved or rejected', 400);

    await query(
      `UPDATE driver_documents SET status = $1, rejection_reason = $2,
       verified_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
       verified_by = $3, updated_at = NOW() WHERE id = $4`,
      [status, rejectionReason || null, req.user.id, req.params.id]
    );

    const doc = await query('SELECT user_id, document_type FROM driver_documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length > 0) {
      const notifType = status === 'approved' ? 'document_approved' : 'document_rejected';
      const msg = status === 'approved'
        ? `Your ${doc.rows[0].document_type} has been approved.`
        : `Your ${doc.rows[0].document_type} was rejected: ${rejectionReason || 'See details'}`;
      await createNotification(doc.rows[0].user_id, notifType, `Document ${status}`, msg);
    }

    res.json({ message: `Document ${status}` });
  } catch (err) { next(err); }
};

const verifyId = async (req, res, next) => {
  try {
    const { status, failureReason } = req.body;
    if (!['verified', 'failed'].includes(status)) throw new AppError('Status must be verified or failed', 400);

    await query(
      `UPDATE id_verifications SET status = $1, failure_reason = $2,
       verified_at = CASE WHEN $1 = 'verified' THEN NOW() ELSE NULL END,
       updated_at = NOW() WHERE id = $3`,
      [status, failureReason || null, req.params.id]
    );

    const v = await query('SELECT user_id FROM id_verifications WHERE id = $1', [req.params.id]);
    if (v.rows.length > 0 && status === 'verified') {
      await query('UPDATE users SET id_verified = TRUE, updated_at = NOW() WHERE id = $1', [v.rows[0].user_id]);
    }
    res.json({ message: `ID verification ${status}` });
  } catch (err) { next(err); }
};

const getPendingDocuments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT dd.*, u.first_name, u.last_name, u.email
       FROM driver_documents dd JOIN users u ON dd.user_id = u.id
       WHERE dd.status = 'pending' ORDER BY dd.created_at ASC`
    );
    res.json({ documents: result.rows });
  } catch (err) { next(err); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [users, rides, bookings, revenue, reports] = await Promise.all([
      query(`SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE role = 'driver' OR role = 'both') as drivers,
             COUNT(*) FILTER (WHERE role = 'passenger' OR role = 'both') as passengers,
             COUNT(*) FILTER (WHERE is_suspended) as suspended FROM users`),
      query(`SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'active') as active,
             COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
             COUNT(*) FILTER (WHERE status = 'completed') as completed FROM rides`),
      query(`SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'completed') as completed,
             COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled FROM bookings`),
      query(`SELECT COALESCE(SUM(platform_fee), 0) as total_commission,
             COALESCE(SUM(amount), 0) as total_volume FROM payments WHERE status = 'completed'`),
      query(`SELECT COUNT(*) FILTER (WHERE status = 'open') as open_reports FROM reports`),
    ]);

    res.json({
      users: users.rows[0],
      rides: rides.rows[0],
      bookings: bookings.rows[0],
      revenue: revenue.rows[0],
      openReports: parseInt(reports.rows[0].open_reports, 10),
    });
  } catch (err) { next(err); }
};

const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = '';
    const values = [];
    if (status) { where = 'WHERE r.status = $1'; values.push(status); }

    const result = await query(
      `SELECT r.*, reporter.first_name as reporter_name, reporter.last_name as reporter_last,
              reported.first_name as reported_name, reported.last_name as reported_last
       FROM reports r
       JOIN users reporter ON r.reporter_id = reporter.id
       LEFT JOIN users reported ON r.reported_user_id = reported.id
       ${where}
       ORDER BY r.created_at DESC`, values);
    res.json({ reports: result.rows });
  } catch (err) { next(err); }
};

const resolveReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    await query(
      `UPDATE reports SET status = $1, admin_notes = $2, resolved_by = $3,
       resolved_at = NOW(), updated_at = NOW() WHERE id = $4`,
      [status || 'resolved', adminNotes || null, req.user.id, req.params.id]
    );
    res.json({ message: 'Report resolved' });
  } catch (err) { next(err); }
};

module.exports = {
  getUsers, suspendUser, unsuspendUser, approveDriver,
  verifyDocument, verifyId, getPendingDocuments, getDashboardStats,
  getReports, resolveReport,
};
