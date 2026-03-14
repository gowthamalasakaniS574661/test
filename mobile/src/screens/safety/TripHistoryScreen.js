import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { safetyAPI } from '../../api/safety';
import { TrustScoreCard } from '../../components/trust';

const STATUS_COLORS = {
  completed: '#D1FAE5',
  confirmed: '#DBEAFE',
  in_progress: '#FEF3C7',
  cancelled: '#FEE2E2',
  disputed: '#FCE7F3',
};

export default function TripHistoryScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTrips = useCallback(async (page = 1, append = false) => {
    try {
      const res = await safetyAPI.getTripHistory({ page, limit: 15 });
      if (append) {
        setTrips((prev) => [...prev, ...res.data.trips]);
      } else {
        setTrips(res.data.trips);
      }
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch trip history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const handleLoadMore = () => {
    if (!pagination || pagination.page >= pagination.pages || loadingMore) return;
    setLoadingMore(true);
    fetchTrips(pagination.page + 1, true);
  };

  const renderTrip = ({ item }) => {
    const statusColor = STATUS_COLORS[item.bookingStatus] || '#F3F4F6';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RideDetail', { rideId: item.rideId })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.roleBadge, item.role === 'driver' ? styles.driverBadge : styles.passengerBadge]}>
            <Text style={styles.roleBadgeText}>
              {item.role === 'driver' ? '🚗 Driver' : '👤 Passenger'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.bookingStatus}</Text>
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.originDot]} />
            <Text style={styles.address} numberOfLines={1}>{item.origin.address}</Text>
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.destDot]} />
            <Text style={styles.address} numberOfLines={1}>{item.destination.address}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.date}>
            {new Date(item.departureTime).toLocaleDateString()} at{' '}
            {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.price}>${parseFloat(item.totalPrice).toFixed(2)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.otherParty}>
            {item.role === 'driver'
              ? `Passenger: ${item.passenger.name}`
              : `Driver: ${item.driver.name}`}
          </Text>
          {item.role === 'passenger' && item.driver.trustScore && (
            <TrustScoreCard score={item.driver.trustScore} compact />
          )}
        </View>

        {item.myRating && (
          <Text style={styles.ratingText}>Your rating: {'⭐'.repeat(item.myRating)}</Text>
        )}

        {item.paymentStatus && (
          <Text style={styles.paymentText}>
            Payment: {item.paymentStatus} {item.paymentAmount && `($${parseFloat(item.paymentAmount).toFixed(2)})`}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.bookingId}
        renderItem={renderTrip}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrips(); }} tintColor="#4F46E5" />
        }
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#4F46E5" style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet. Book a ride to get started!</Text>}
        ListHeaderComponent={
          pagination && pagination.total > 0 ? (
            <Text style={styles.totalText}>{pagination.total} total trip{pagination.total !== 1 ? 's' : ''}</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  totalText: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  driverBadge: { backgroundColor: '#EDE9FE' },
  passengerBadge: { backgroundColor: '#DBEAFE' },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize', color: '#374151' },
  route: { gap: 6, marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  originDot: { backgroundColor: '#4F46E5' },
  destDot: { backgroundColor: '#EF4444' },
  address: { flex: 1, fontSize: 14, color: '#374151' },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  date: { fontSize: 13, color: '#6B7280' },
  price: { fontSize: 15, fontWeight: '700', color: '#059669' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  otherParty: { fontSize: 13, color: '#6B7280' },
  ratingText: { fontSize: 12, color: '#D97706', marginTop: 6 },
  paymentText: { fontSize: 12, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
