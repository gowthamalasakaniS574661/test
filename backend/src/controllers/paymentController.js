const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const booking = await query(
      `SELECT b.*, r.driver_id FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE b.id = $1`,
      [bookingId]
    );
    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    if (booking.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);

    const existingPayment = await query(
      `SELECT id FROM payments WHERE booking_id = $1 AND status IN ('pending', 'processing', 'completed')`,
      [bookingId]
    );
    if (existingPayment.rows.length > 0) throw new AppError('Payment already exists for this booking', 400);

    // Placeholder: In production, integrate with Stripe, PayPal, etc.
    const externalTransactionId = `txn_placeholder_${Date.now()}`;

    const result = await query(
      `INSERT INTO payments (booking_id, payer_id, payee_id, amount, payment_method, external_transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [bookingId, req.user.id, booking.rows[0].driver_id,
       booking.rows[0].total_price, paymentMethod || 'card',
       externalTransactionId, 'processing']
    );

    res.status(201).json({
      message: 'Payment initiated',
      payment: formatPayment(result.rows[0]),
    });
  } catch (err) {
    next(err);
  }
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM payments WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Payment not found', 404);
    if (result.rows[0].payer_id !== req.user.id && result.rows[0].payee_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    res.json({ payment: formatPayment(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

const completePayment = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM payments WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Payment not found', 404);
    if (result.rows[0].status !== 'processing') throw new AppError('Payment is not in processing state', 400);

    // Placeholder: Verify with payment gateway
    await query(
      `UPDATE payments SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Payment completed' });
  } catch (err) {
    next(err);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, b.ride_id
       FROM payments p JOIN bookings b ON p.booking_id = b.id
       WHERE p.payer_id = $1 OR p.payee_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ payments: result.rows.map(formatPayment) });
  } catch (err) {
    next(err);
  }
};

function formatPayment(p) {
  return {
    id: p.id,
    bookingId: p.booking_id,
    payerId: p.payer_id,
    payeeId: p.payee_id,
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.payment_method,
    externalTransactionId: p.external_transaction_id,
    status: p.status,
    createdAt: p.created_at,
  };
}

module.exports = { initiatePayment, getPaymentStatus, completePayment, getMyPayments };
