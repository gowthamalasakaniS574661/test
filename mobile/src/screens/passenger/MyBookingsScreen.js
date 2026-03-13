import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingsAPI } from '../../api/bookings';

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingsAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  const handleCancel = async (id) => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await bookingsAPI.cancelBooking(id);
          fetchBookings();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed to cancel');
        }
      }},
    ]);
  };

  const statusColors = {
    confirmed: '#D1FAE5', in_progress: '#DBEAFE', completed: '#F3F4F6', cancelled: '#FEE2E2', disputed: '#FEF3C7',
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RideDetail', { rideId: item.rideId })}>
      <View style={styles.cardHeader}>
        <Text style={styles.price}>${item.totalPrice}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#F3F4F6' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.routeText}>{item.rideOrigin} → {item.rideDestination}</Text>
      <Text style={styles.meta}>Driver: {item.driverName} | Seats: {item.seatsBooked}</Text>
      <Text style={styles.date}>{new Date(item.departureTime).toLocaleString()}</Text>
      {item.status === 'confirmed' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor="#4F46E5" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '700', color: '#059669' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  routeText: { fontSize: 15, fontWeight: '500', color: '#374151', marginBottom: 4 },
  meta: { fontSize: 13, color: '#6B7280' },
  date: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  cancelBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  cancelText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
