import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { matchingAPI } from '../../api/matching';
import { bidsAPI } from '../../api/bids';
import { TrustScoreCard } from '../../components/trust';

export default function SelectDriverScreen({ route, navigation }) {
  const { requestId } = route.params;
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => { loadRankedDrivers(); }, [requestId]);

  const loadRankedDrivers = async () => {
    try {
      const res = await matchingAPI.getRankedDrivers(requestId);
      setDrivers(res.data.drivers);
    } catch (err) {
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bidId) => {
    setAccepting(bidId);
    try {
      await bidsAPI.respondToBid(bidId, { status: 'accepted' });
      Alert.alert('Success', 'Driver selected! Booking will be created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept bid');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  const renderDriver = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>

      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.driverName}</Text>
        <TrustScoreCard score={item.trustScore} totalRatings={item.totalRatings} compact />
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>${item.amount.toFixed(2)}</Text>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{item.matchScore}% match</Text>
        </View>
      </View>

      <View style={styles.factorsRow}>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Price</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${item.factors.priceScore}%` }]} />
          </View>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Rating</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${item.factors.ratingScore}%` }]} />
          </View>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Distance</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${item.factors.distanceScore}%` }]} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => handleAccept(item.bidId)}
        disabled={accepting === item.bidId}
      >
        {accepting === item.bidId
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.selectBtnText}>Select Driver</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.bidId}
        renderItem={renderDriver}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No bids yet. Check back later.</Text>}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Drivers ranked by price, rating, proximity, and trust score
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  headerText: { fontSize: 13, color: '#6B7280', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  rankBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#4F46E5', borderRadius: 12, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  rankText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  driverInfo: { marginBottom: 10 },
  driverName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 24, fontWeight: '800', color: '#059669' },
  matchBadge: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  matchText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  factorsRow: { gap: 6, marginBottom: 14 },
  factor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorLabel: { fontSize: 12, color: '#6B7280', width: 50 },
  factorBar: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  factorFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },
  selectBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  selectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
