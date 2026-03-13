import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ridesAPI } from '../../api/rides';

export default function SearchRidesScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const fetchRides = useCallback(async () => {
    try {
      const params = {};
      if (origin) params.origin = origin;
      if (destination) params.destination = destination;
      const response = await ridesAPI.getRides(params);
      setRides(response.data.rides);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [origin, destination]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const onRefresh = () => { setRefreshing(true); fetchRides(); };

  const renderRide = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.price}>${item.pricePerSeat}/seat</Text>
        <View style={[styles.badge, item.allowBidding && styles.badgeBid]}>
          <Text style={styles.badgeText}>{item.allowBidding ? 'Biddable' : 'Fixed'}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.dot} />
        <Text style={styles.address} numberOfLines={1}>{item.origin.address}</Text>
      </View>
      <View style={styles.route}>
        <View style={[styles.dot, styles.dotDestination]} />
        <Text style={styles.address} numberOfLines={1}>{item.destination.address}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>{new Date(item.departureTime).toLocaleDateString()} at {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={styles.meta}>{item.availableSeats} seats left</Text>
      </View>
      {item.driver && (
        <Text style={styles.driver}>{item.driver.firstName} {item.driver.lastName} - Rating: {item.driver.trustScore}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.searchInput} placeholder="From..." placeholderTextColor="#9CA3AF" value={origin} onChangeText={setOrigin} onSubmitEditing={fetchRides} />
        <TextInput style={styles.searchInput} placeholder="To..." placeholderTextColor="#9CA3AF" value={destination} onChangeText={setDestination} onSubmitEditing={fetchRides} />
        <TouchableOpacity style={styles.searchButton} onPress={fetchRides}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No rides found. Try different search terms.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: { padding: 16, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: {
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  searchButton: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 20, fontWeight: '700', color: '#059669' },
  badge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeBid: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  route: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
  dotDestination: { backgroundColor: '#EF4444' },
  address: { flex: 1, fontSize: 14, color: '#374151' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  meta: { fontSize: 13, color: '#6B7280' },
  driver: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
