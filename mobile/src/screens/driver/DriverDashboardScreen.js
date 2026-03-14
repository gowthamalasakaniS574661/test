import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ridesAPI, rideRequestsAPI } from '../../api/rides';
import { paymentsAPI } from '../../api/payments';
import { adsAPI } from '../../api/ads';
import { TrustScoreCard } from '../../components/trust';

export default function DriverDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0 });
  const [openRequests, setOpenRequests] = useState(0);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ridesRes, paymentsRes, requestsRes, adsRes] = await Promise.all([
        ridesAPI.getMyRides().catch(() => ({ data: { rides: [] } })),
        paymentsAPI.getMyPayments().catch(() => ({ data: { payments: [] } })),
        rideRequestsAPI.getRideRequests({}).catch(() => ({ data: { rideRequests: [] } })),
        adsAPI.getAds('driver_dashboard').catch(() => ({ data: { ads: [] } })),
      ]);

      setRides(ridesRes.data.rides || []);
      setAds(adsRes.data.ads || []);

      const payments = paymentsRes.data.payments || [];
      const completed = payments.filter((p) => p.payeeId === user?.id && p.status === 'completed');
      const pending = payments.filter((p) => p.payeeId === user?.id && p.status === 'escrow');
      setEarnings({
        total: completed.reduce((s, p) => s + parseFloat(p.driverAmount || p.amount), 0),
        pending: pending.reduce((s, p) => s + parseFloat(p.driverAmount || p.amount), 0),
      });

      const requests = requestsRes.data.rideRequests || [];
      setOpenRequests(requests.length);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  const activeRides = rides.filter((r) => ['active', 'in_progress'].includes(r.status));
  const completedCount = rides.filter((r) => r.status === 'completed').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F46E5" />}
    >
      <Text style={styles.title}>Driver Dashboard</Text>

      <View style={styles.earningsCard}>
        <View style={styles.earningsRow}>
          <View style={styles.earningItem}>
            <Text style={styles.earningValue}>${earnings.total.toFixed(2)}</Text>
            <Text style={styles.earningLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={[styles.earningValue, { color: '#2563EB' }]}>${earnings.pending.toFixed(2)}</Text>
            <Text style={styles.earningLabel}>In Escrow</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.earningsBtn} onPress={() => navigation.navigate('Earnings')}>
          <Text style={styles.earningsBtnText}>View Earnings →</Text>
        </TouchableOpacity>
      </View>

      <TrustScoreCard score={user?.trustScore} totalRatings={user?.totalRatings} />

      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{activeRides.length}</Text>
          <Text style={styles.miniStatLabel}>Active</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{completedCount}</Text>
          <Text style={styles.miniStatLabel}>Completed</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{openRequests}</Text>
          <Text style={styles.miniStatLabel}>Open Requests</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostRide')}>
          <Text style={styles.actionBtnText}>+ Post Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => navigation.navigate('MyRidesList')}>
          <Text style={[styles.actionBtnText, { color: '#4F46E5' }]}>My Rides</Text>
        </TouchableOpacity>
      </View>

      {activeRides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Rides</Text>
          {activeRides.slice(0, 3).map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={() => navigation.navigate('RideDetail', { rideId: ride.id })}
            >
              <Text style={styles.rideRoute}>{ride.origin.address} → {ride.destination.address}</Text>
              <Text style={styles.rideMeta}>
                {new Date(ride.departureTime).toLocaleDateString()} · {ride.availableSeats} seats · ${ride.pricePerSeat}/seat
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {ads.length > 0 && (
        <View style={styles.adBanner}>
          <Text style={styles.adLabel}>Sponsored</Text>
          <Text style={styles.adTitle}>{ads[0].title}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16 },
  earningsCard: { backgroundColor: '#059669', borderRadius: 16, padding: 20, marginBottom: 12 },
  earningsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  earningItem: { alignItems: 'center', flex: 1 },
  earningValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  earningLabel: { fontSize: 13, color: '#D1FAE5', marginTop: 4 },
  earningDivider: { width: 1, backgroundColor: '#34D399' },
  earningsBtn: { marginTop: 14, alignItems: 'center' },
  earningsBtnText: { color: '#D1FAE5', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 12 },
  miniStat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  miniStatValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  miniStatLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionBtnOutline: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#4F46E5' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  rideCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  rideRoute: { fontSize: 14, fontWeight: '500', color: '#374151' },
  rideMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  adBanner: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#C7D2FE' },
  adLabel: { fontSize: 10, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1 },
  adTitle: { fontSize: 14, fontWeight: '600', color: '#1E1B4B', marginTop: 4 },
});
