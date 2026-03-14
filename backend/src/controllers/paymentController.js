const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const stripe = require('../config/stripe');
const config = require('../config');

const PLATFORM_FEE_PERCENT = config.stripe.platformFeePercent;

/**
 * Create a Stripe PaymentIntent with manual capture (escrow).
 * The passenger's card is authorized but not charged until the ride completes.
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await query(
      `SELECT b.*, r.driver_id, r.origin_address, r.destination_address,
              u.email as driver_email, u.stripe_account_id as driver_stripe_id
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN users u ON r.driver_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (booking.rows.length === 0) throw new AppError('Booking not found', 404);
    if (booking.rows[0].passenger_id !== req.user.id) throw new AppError('Not authorized', 403);

    const existingPayment = await query(
      `SELECT id, status, stripe_payment_intent_id FROM payments
       WHERE booking_id = $1 AND status IN ('pending', 'escrow', 'processing', 'completed')`,
      [bookingId]
    );

    if (existingPayment.rows.length > 0) {
      const existing = existingPayment.rows[0];
      if (existing.status === 'pending' && existing.stripe_payment_intent_id) {
        const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
        return res.json({
          payment: { id: existing.id, status: existing.status },
          clientSecret: intent.client_secret,
          publishableKey: config.stripe.publishableKey,
        });
      }
      throw new AppError('Payment already exists for this booking', 400);
    }

    const totalAmount = parseFloat(booking.rows[0].total_price);
    const amountInCents = Math.round(totalAmount * 100);
    const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));

    const paymentIntentParams = {
      amount: amountInCents,
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        bookingId,
        passengerId: req.user.id,
        driverId: booking.rows[0].driver_id,
        platformFee: platformFee.toString(),
        rideRoute: `${booking.rows[0].origin_address} → ${booking.rows[0].destination_address}`,
      },
    };

    if (booking.rows[0].driver_stripe_id) {
      paymentIntentParams.transfer_data = {
        destination: booking.rows[0].driver_stripe_id,
      };
      paymentIntentParams.application_fee_amount = platformFee;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    const result = await query(
      `INSERT INTO payments (
        booking_id, payer_id, payee_id, amount, platform_fee, driver_amount,
        currency, payment_method, stripe_payment_intent_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        bookingId,
        req.user.id,
        booking.rows[0].driver_id,
        totalAmount,
        (platformFee / 100).toFixed(2),
        ((amountInCents - platformFee) / 100).toFixed(2),
        'USD',
        'card',
        paymentIntent.id,
        'pending',
      ]
    );

    res.status(201).json({
      payment: formatPayment(result.rows[0]),
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.stripe.publishableKey,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * After the passenger confirms the payment on the client, this endpoint
 * marks the payment as held in escrow (authorized but not yet captured).
 */
const confirmEscrow = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const payment = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    if (payment.rows.length === 0) throw new AppError('Payment not found', 404);
    if (payment.rows[0].payer_id !== req.user.id) throw new AppError('Not authorized', 403);

    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.rows[0].stripe_payment_intent_id
    );

    if (paymentIntent.status !== 'requires_capture') {
      throw new AppError(
        `Payment is in unexpected state: ${paymentIntent.status}. Expected: requires_capture`,
        400
      );
    }

    await query(
      `UPDATE payments SET status = 'escrow', updated_at = NOW() WHERE id = $1`,
      [paymentId]
    );

    await query(
      `UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [payment.rows[0].booking_id]
    );

    res.json({
      message: 'Payment held in escrow. Funds will be released to the driver after ride completion.',
      payment: { ...formatPayment(payment.rows[0]), status: 'escrow' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Capture the held payment after ride completion.
 * Deducts platform commission and transfers remainder to driver.
 */
const capturePayment = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const payment = await client.query(
      `SELECT p.*, b.ride_id, r.driver_id
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN rides r ON b.ride_id = r.id
       WHERE p.id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (payment.rows.length === 0) throw new AppError('Payment not found', 404);
    const p = payment.rows[0];

    if (p.driver_id !== req.user.id) {
      throw new AppError('Only the driver can capture payment', 403);
    }
    if (p.status !== 'escrow') {
      throw new AppError('Payment must be in escrow to capture', 400);
    }

    const paymentIntent = await stripe.paymentIntents.capture(
      p.stripe_payment_intent_id
    );

    let stripeTransferId = null;
    if (paymentIntent.transfer_data?.destination) {
      const transfers = await stripe.transfers.list({
        transfer_group: paymentIntent.transfer_group,
        limit: 1,
      });
      if (transfers.data.length > 0) {
        stripeTransferId = transfers.data[0].id;
      }
    }

    await client.query(
      `UPDATE payments SET
        status = 'completed',
        stripe_transfer_id = $2,
        captured_at = NOW(),
        updated_at = NOW()
       WHERE id = $1`,
      [req.params.id, stripeTransferId]
    );

    await client.query(
      `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [p.booking_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Payment captured. Driver payout initiated.',
      payment: {
        ...formatPayment(p),
        status: 'completed',
        stripeTransferId,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Refund an escrow payment (e.g., when a booking is cancelled before ride starts).
 */
const refundPayment = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const payment = await client.query(
      'SELECT * FROM payments WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (payment.rows.length === 0) throw new AppError('Payment not found', 404);
    const p = payment.rows[0];

    if (p.payer_id !== req.user.id && p.payee_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }
    if (p.status !== 'escrow' && p.status !== 'pending') {
      throw new AppError('Only escrowed or pending payments can be refunded', 400);
    }

    if (p.stripe_payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(p.stripe_payment_intent_id);

      if (paymentIntent.status === 'requires_capture') {
        await stripe.paymentIntents.cancel(p.stripe_payment_intent_id);
      } else if (paymentIntent.status === 'succeeded') {
        await stripe.refunds.create({
          payment_intent: p.stripe_payment_intent_id,
        });
      }
    }

    await client.query(
      `UPDATE payments SET status = 'refunded', refunded_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Payment refunded successfully',
      payment: { ...formatPayment(p), status: 'refunded' },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Get payment status for a specific payment.
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw new AppError('Payment not found', 404);
    if (result.rows[0].payer_id !== req.user.id && result.rows[0].payee_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    res.json({ payment: formatPayment(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment by booking ID.
 */
const getPaymentByBooking = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM payments WHERE booking_id = $1 AND status != 'failed'
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.bookingId]
    );

    if (result.rows.length === 0) {
      return res.json({ payment: null });
    }

    const p = result.rows[0];
    if (p.payer_id !== req.user.id && p.payee_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    res.json({ payment: formatPayment(p) });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all payments for the current user.
 */
const getMyPayments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, b.ride_id,
              r.origin_address, r.destination_address,
              payer.first_name as payer_first_name, payer.last_name as payer_last_name,
              payee.first_name as payee_first_name, payee.last_name as payee_last_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN rides r ON b.ride_id = r.id
       JOIN users payer ON p.payer_id = payer.id
       JOIN users payee ON p.payee_id = payee.id
       WHERE p.payer_id = $1 OR p.payee_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({
      payments: result.rows.map((p) => ({
        ...formatPayment(p),
        rideRoute: `${p.origin_address} → ${p.destination_address}`,
        payerName: `${p.payer_first_name} ${p.payer_last_name}`,
        payeeName: `${p.payee_first_name} ${p.payee_last_name}`,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a Stripe Connect onboarding link for drivers.
 */
const createConnectAccount = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver' && req.user.role !== 'both') {
      throw new AppError('Only drivers can create connect accounts', 403);
    }

    const existingUser = await query('SELECT stripe_account_id FROM users WHERE id = $1', [req.user.id]);
    let accountId = existingUser.rows[0]?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: req.user.email,
        metadata: { userId: req.user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await query(
        'UPDATE users SET stripe_account_id = $1, updated_at = NOW() WHERE id = $2',
        [accountId, req.user.id]
      );
    }

    const { returnUrl, refreshUrl } = req.body;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || 'https://rideshare-marketplace.com/stripe/refresh',
      return_url: returnUrl || 'https://rideshare-marketplace.com/stripe/return',
      type: 'account_onboarding',
    });

    res.json({
      url: accountLink.url,
      accountId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Check the status of a driver's Stripe Connect account.
 */
const getConnectAccountStatus = async (req, res, next) => {
  try {
    const user = await query('SELECT stripe_account_id FROM users WHERE id = $1', [req.user.id]);
    const accountId = user.rows[0]?.stripe_account_id;

    if (!accountId) {
      return res.json({
        connected: false,
        accountId: null,
        payoutsEnabled: false,
        chargesEnabled: false,
      });
    }

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      connected: true,
      accountId,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Stripe dashboard link for drivers to view their payouts.
 */
const getConnectDashboardLink = async (req, res, next) => {
  try {
    const user = await query('SELECT stripe_account_id FROM users WHERE id = $1', [req.user.id]);
    const accountId = user.rows[0]?.stripe_account_id;

    if (!accountId) throw new AppError('No Stripe account found', 400);

    const loginLink = await stripe.accounts.createLoginLink(accountId);
    res.json({ url: loginLink.url });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle Stripe webhooks for payment status updates.
 */
const handleWebhook = async (req, res, next) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        const paymentIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'escrow', updated_at = NOW()
           WHERE stripe_payment_intent_id = $1 AND status = 'pending'`,
          [paymentIntent.id]
        );
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'completed', captured_at = NOW(), updated_at = NOW()
           WHERE stripe_payment_intent_id = $1`,
          [paymentIntent.id]
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'failed', updated_at = NOW()
           WHERE stripe_payment_intent_id = $1`,
          [paymentIntent.id]
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        if (charge.payment_intent) {
          await query(
            `UPDATE payments SET status = 'refunded', refunded_at = NOW(), updated_at = NOW()
             WHERE stripe_payment_intent_id = $1`,
            [charge.payment_intent]
          );
        }
        break;
      }
    }

    res.json({ received: true });
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
    platformFee: p.platform_fee,
    driverAmount: p.driver_amount,
    currency: p.currency,
    paymentMethod: p.payment_method,
    stripePaymentIntentId: p.stripe_payment_intent_id,
    stripeTransferId: p.stripe_transfer_id,
    status: p.status,
    capturedAt: p.captured_at,
    refundedAt: p.refunded_at,
    createdAt: p.created_at,
  };
}

module.exports = {
  createPaymentIntent,
  confirmEscrow,
  capturePayment,
  refundPayment,
  getPaymentStatus,
  getPaymentByBooking,
  getMyPayments,
  createConnectAccount,
  getConnectAccountStatus,
  getConnectDashboardLink,
  handleWebhook,
};
