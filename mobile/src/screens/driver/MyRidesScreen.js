import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ridesAPI } from '../../api/rides';

export default function MyRidesScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = useCallback(async () => {
    try {
      const response = await ridesAPI.getMyRides();
      setRides(response.data.rides);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchRides(); }, [fetchRides]));

  const handleCancel = async (id) => {
    Alert.alert('Cancel Ride', 'This will cancel the ride and all confirmed bookings.', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await ridesAPI.cancelRide(id);
          fetchRides();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.error || 'Failed to cancel');
        }
      }},
    ]);
  };

  const statusColors = {
    active: '#D1FAE5', full: '#DBEAFE', in_progress: '#FEF3C7', completed: '#F3F4F6', cancelled: '#FEE2E2',
  };

  const renderRide = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.price}>${item.pricePerSeat}/seat</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#F3F4F6' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.routeText}>{item.origin.address}</Text>
      <Text style={styles.arrow}>↓</Text>
      <Text style={styles.routeText}>{item.destination.address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>{new Date(item.departureTime).toLocaleString()}</Text>
        <Text style={styles.seats}>{item.availableSeats} seats</Text>
      </View>
      {item.status === 'active' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
          <Text style={styles.cancelText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor="#4F46E5" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No rides posted yet</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostRide')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  price: { fontSize: 20, fontWeight: '700', color: '#059669' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  routeText: { fontSize: 14, color: '#374151' },
  arrow: { color: '#9CA3AF', fontSize: 16, paddingLeft: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  meta: { fontSize: 13, color: '#6B7280' },
  seats: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  cancelBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  cancelText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
