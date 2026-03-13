import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ridesAPI } from '../../api/rides';
import { bidsAPI } from '../../api/bids';
import { bookingsAPI } from '../../api/bookings';
import { useAuth } from '../../contexts/AuthContext';

export default function RideDetailScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRide();
  }, [rideId]);

  const loadRide = async () => {
    try {
      const response = await ridesAPI.getRideById(rideId);
      setRide(response.data.ride);
    } catch (err) {
      Alert.alert('Error', 'Failed to load ride details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBookDirectly = async () => {
    setSubmitting(true);
    try {
      await bookingsAPI.createBooking({ rideId });
      Alert.alert('Success', 'Ride booked!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }
    setSubmitting(true);
    try {
      await bidsAPI.createBid({ rideId, amount: parseFloat(bidAmount), message: bidMessage });
      Alert.alert('Success', 'Bid placed!');
      setBidAmount('');
      setBidMessage('');
      loadRide();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Bid failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  if (!ride) return null;

  const isOwnRide = ride.driverId === user?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.price}>${ride.pricePerSeat}<Text style={styles.priceUnit}>/seat</Text></Text>
        <View style={[styles.statusBadge, styles[`status_${ride.status}`]]}>
          <Text style={styles.statusText}>{ride.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.routeItem}>
          <View style={styles.dotOrigin} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeAddress}>{ride.origin.address}</Text>
          </View>
        </View>
        <View style={styles.routeItem}>
          <View style={styles.dotDest} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Dropoff</Text>
            <Text style={styles.routeAddress}>{ride.destination.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Departure</Text>
          <Text style={styles.detailValue}>{new Date(ride.departureTime).toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Available Seats</Text>
          <Text style={styles.detailValue}>{ride.availableSeats}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base Price</Text>
          <Text style={styles.detailValue}>${ride.basePrice}</Text>
        </View>
        {ride.description && <Text style={styles.description}>{ride.description}</Text>}
      </View>

      {ride.driver && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <Text style={styles.driverName}>{ride.driver.firstName} {ride.driver.lastName}</Text>
          <Text style={styles.trustScore}>Trust Score: {ride.driver.trustScore}/5 ({ride.driver.totalRatings} ratings)</Text>
          {ride.vehicle && (
            <Text style={styles.vehicle}>{ride.vehicle.color} {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}</Text>
          )}
        </View>
      )}

      {!isOwnRide && ride.status === 'active' && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookDirectly} disabled={submitting}>
            <Text style={styles.bookButtonText}>Book Now - ${ride.pricePerSeat}/seat</Text>
          </TouchableOpacity>

          {ride.allowBidding && (
            <View style={styles.bidSection}>
              <Text style={styles.sectionTitle}>Place a Bid</Text>
              <TextInput
                style={styles.input}
                placeholder="Your bid amount ($)"
                placeholderTextColor="#9CA3AF"
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Message (optional)"
                placeholderTextColor="#9CA3AF"
                value={bidMessage}
                onChangeText={setBidMessage}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.bidButton} onPress={handlePlaceBid} disabled={submitting}>
                <Text style={styles.bidButtonText}>Place Bid</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {ride.bids && ride.bids.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bids ({ride.bids.length})</Text>
          {ride.bids.map((bid) => (
            <View key={bid.id} style={styles.bidCard}>
              <View style={styles.bidHeader}>
                <Text style={styles.bidderName}>{bid.bidderName}</Text>
                <Text style={styles.bidAmount}>${bid.amount}</Text>
              </View>
              <Text style={styles.bidTrust}>Trust: {bid.bidderTrustScore}/5</Text>
              {bid.message && <Text style={styles.bidMsg}>{bid.message}</Text>}
              <Text style={[styles.bidStatus, styles[`bid_${bid.status}`]]}>{bid.status}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  price: { fontSize: 32, fontWeight: '800', color: '#059669' },
  priceUnit: { fontSize: 16, fontWeight: '400', color: '#6B7280' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  status_active: { backgroundColor: '#D1FAE5' },
  status_full: { backgroundColor: '#FEF3C7' },
  status_completed: { backgroundColor: '#DBEAFE' },
  status_cancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dotOrigin: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4F46E5' },
  dotDest: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  routeAddress: { fontSize: 15, color: '#374151' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  description: { fontSize: 14, color: '#374151', marginTop: 8, lineHeight: 20 },
  driverName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  trustScore: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  vehicle: { fontSize: 14, color: '#374151', marginTop: 4 },
  bookButton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bidSection: { marginTop: 16, gap: 10 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  bidButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  bidButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bidCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  bidHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  bidderName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  bidAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },
  bidTrust: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  bidMsg: { fontSize: 13, color: '#374151', marginTop: 4 },
  bidStatus: { fontSize: 12, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' },
  bid_pending: { color: '#D97706' },
  bid_accepted: { color: '#059669' },
  bid_rejected: { color: '#DC2626' },
});
