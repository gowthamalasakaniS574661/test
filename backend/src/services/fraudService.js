const { query } = require('../config/database');

async function checkFraudSignals(userId) {
  const flags = [];

  const user = await query(
    'SELECT trust_score, is_suspended, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (user.rows.length === 0) return { blocked: true, flags: ['user_not_found'] };
  if (user.rows[0].is_suspended) return { blocked: true, flags: ['account_suspended'] };

  const accountAge = (Date.now() - new Date(user.rows[0].created_at).getTime()) / 86400000;
  if (accountAge < 1) flags.push('new_account');

  if (parseFloat(user.rows[0].trust_score) < 2.0) flags.push('low_trust_score');

  const recentCancels = await query(
    `SELECT COUNT(*) FROM bookings
     WHERE passenger_id = $1 AND status = 'cancelled'
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  if (parseInt(recentCancels.rows[0].count, 10) >= 3) flags.push('excessive_cancellations');

  const recentReports = await query(
    `SELECT COUNT(*) FROM reports
     WHERE reported_user_id = $1 AND status IN ('open', 'investigating')`,
    [userId]
  );
  if (parseInt(recentReports.rows[0].count, 10) >= 2) flags.push('active_reports');

  const failedPayments = await query(
    `SELECT COUNT(*) FROM payments
     WHERE payer_id = $1 AND status = 'failed'
       AND created_at > NOW() - INTERVAL '7 days'`,
    [userId]
  );
  if (parseInt(failedPayments.rows[0].count, 10) >= 3) flags.push('repeated_payment_failures');

  const blocked = flags.includes('account_suspended') || flags.includes('excessive_cancellations');

  return { blocked, flags, riskLevel: flags.length === 0 ? 'low' : flags.length <= 2 ? 'medium' : 'high' };
}

module.exports = { checkFraudSignals };
