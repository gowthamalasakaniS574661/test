import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentsAPI } from '../../api/payments';
import { bookingsAPI } from '../../api/bookings';

export default function PaymentScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const PLATFORM_FEE_PERCENT = 1;

  useEffect(() => {
    loadBookingAndPayment();
  }, [bookingId]);

  const loadBookingAndPayment = async () => {
    try {
      const [bookingRes, paymentRes] = await Promise.all([
        bookingsAPI.getBookingById(bookingId),
        paymentsAPI.getPaymentByBooking(bookingId),
      ]);
      setBooking(bookingRes.data.booking || bookingRes.data);
      setPayment(paymentRes.data.payment);
    } catch (err) {
      Alert.alert('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = useCallback(async () => {
    setProcessing(true);
    try {
      const response = await paymentsAPI.createPaymentIntent(bookingId);
      const { clientSecret, publishableKey, payment: newPayment } = response.data;
      setPayment(newPayment);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'RideShare Marketplace',
        style: 'automatic',
        defaultBillingDetails: {
          name: booking?.passengerName,
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setPaymentReady(true);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  }, [bookingId, booking, initPaymentSheet]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
      } else {
        await paymentsAPI.confirmEscrow(payment.id);

        Alert.alert(
          'Payment Successful',
          'Your payment is held securely in escrow. The driver will be paid after the ride is completed.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Payment confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (!booking) return null;

  const totalAmount = parseFloat(booking.totalPrice);
  const platformFee = totalAmount * (PLATFORM_FEE_PERCENT / 100);
  const driverAmount = totalAmount - platformFee;
  const isPaid = payment && ['escrow', 'completed'].includes(payment.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        {isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>
              {payment.status === 'escrow' ? 'In Escrow' : 'Paid'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ride Summary</Text>
        {booking.rideOrigin && (
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.originDot]} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.rideOrigin}</Text>
          </View>
        )}
        {booking.rideDestination && (
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.destDot]} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.rideDestination}</Text>
          </View>
        )}
        {booking.departureTime && (
          <Text style={styles.departureTime}>
            {new Date(booking.departureTime).toLocaleString()}
          </Text>
        )}
        {booking.driverName && (
          <Text style={styles.driverInfo}>Driver: {booking.driverName}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Ride fare ({booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''})</Text>
          <Text style={styles.priceValue}>${totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Platform fee ({PLATFORM_FEE_PERCENT}%)</Text>
          <Text style={styles.priceValue}>${platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.driverPayLabel}>Driver receives</Text>
          <Text style={styles.driverPayValue}>${driverAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How Escrow Works</Text>
        <View style={styles.escrowStep}>
          <View style={[styles.stepDot, styles.stepActive]} />
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>1. Pay Now</Text>
            <Text style={styles.stepDesc}>Your card is authorized and the amount is held securely.</Text>
          </View>
        </View>
        <View style={styles.escrowStep}>
          <View style={[styles.stepDot, isPaid && styles.stepActive]} />
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>2. Ride Happens</Text>
            <Text style={styles.stepDesc}>Funds stay in escrow during the ride.</Text>
          </View>
        </View>
        <View style={styles.escrowStep}>
          <View style={[styles.stepDot, payment?.status === 'completed' && styles.stepActive]} />
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>3. Driver Gets Paid</Text>
            <Text style={styles.stepDesc}>After ride completion, funds are released to the driver minus the {PLATFORM_FEE_PERCENT}% fee.</Text>
          </View>
        </View>
      </View>

      {isPaid ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>
            {payment.status === 'escrow' ? '🔒' : '✅'}
          </Text>
          <Text style={styles.statusTitle}>
            {payment.status === 'escrow' ? 'Payment Secured in Escrow' : 'Payment Complete'}
          </Text>
          <Text style={styles.statusDesc}>
            {payment.status === 'escrow'
              ? 'Your payment is being held securely. It will be released to the driver once the ride is completed.'
              : 'The payment has been processed and the driver has been paid.'}
          </Text>
          {payment.status === 'escrow' && (
            <TouchableOpacity
              style={styles.refundButton}
              onPress={() => {
                Alert.alert(
                  'Request Refund',
                  'Are you sure you want to cancel and request a refund?',
                  [
                    { text: 'No' },
                    {
                      text: 'Yes, Refund',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await paymentsAPI.refundPayment(payment.id);
                          Alert.alert('Refunded', 'Your payment has been refunded.', [
                            { text: 'OK', onPress: () => navigation.goBack() },
                          ]);
                        } catch (err) {
                          Alert.alert('Error', err.response?.data?.error || 'Refund failed');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.refundButtonText}>Request Refund</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.actionSection}>
          {!paymentReady ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={initializePayment}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Pay ${totalAmount.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.secureText}>🔒 Secured by Stripe</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  paidBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  paidBadgeText: { color: '#059669', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  originDot: { backgroundColor: '#4F46E5' },
  destDot: { backgroundColor: '#EF4444' },
  routeText: { flex: 1, fontSize: 14, color: '#374151' },
  departureTime: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  driverInfo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, color: '#6B7280' },
  priceValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  driverPayLabel: { fontSize: 13, color: '#059669' },
  driverPayValue: { fontSize: 13, fontWeight: '600', color: '#059669' },
  escrowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginTop: 2,
  },
  stepActive: { backgroundColor: '#4F46E5' },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stepDesc: { fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 18 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: { fontSize: 40, marginBottom: 12 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  statusDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  refundButton: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refundButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  actionSection: { alignItems: 'center', marginTop: 8 },
  payButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secureText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
