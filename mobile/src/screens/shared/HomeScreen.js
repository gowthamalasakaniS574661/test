import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ridesAPI } from '../../api/rides';
import { bookingsAPI } from '../../api/bookings';
import { notificationsAPI } from '../../api/notifications';
import { adsAPI } from '../../api/ads';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDriver = user?.role === 'driver' || user?.role === 'both';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, notifRes, adsRes] = await Promise.all([
        bookingsAPI.getMyBookings().catch(() => ({ data: { bookings: [] } })),
        notificationsAPI.getNotifications('true').catch(() => ({ data: { unreadCount: 0 } })),
        adsAPI.getAds('search').catch(() => ({ data: { ads: [] } })),
      ]);

      const bookings = bookingsRes.data.bookings || [];
      setStats({
        activeBookings: bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status)).length,
        completedRides: bookings.filter((b) => b.status === 'completed').length,
      });
      setUnreadCount(notifRes.data.unreadCount || 0);
      setAds(adsRes.data.ads || []);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeBookings}</Text>
            <Text style={styles.statLabel}>Active Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedRides}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>{parseFloat(user?.trustScore || 5).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Search')}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionLabel}>Find Ride</Text>
        </TouchableOpacity>
        {isDriver && (
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('My Rides', { screen: 'PostRide' })}>
            <Text style={styles.actionIcon}>🚗</Text>
            <Text style={styles.actionLabel}>Post Ride</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile', { screen: 'SOS' })}>
          <Text style={[styles.actionIcon, { fontSize: 28 }]}>🚨</Text>
          <Text style={styles.actionLabel}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile', { screen: 'TripHistory' })}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionLabel}>Trip History</Text>
        </TouchableOpacity>
      </View>

      {ads.length > 0 && (
        <View style={styles.adCard}>
          <Text style={styles.adLabel}>Sponsored</Text>
          <Text style={styles.adTitle}>{ads[0].title}</Text>
          {ads[0].description && <Text style={styles.adDesc}>{ads[0].description}</Text>}
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
  greeting: { fontSize: 26, fontWeight: '800', color: '#111827' },
  role: { fontSize: 14, color: '#6B7280', textTransform: 'capitalize', marginTop: 2 },
  notifBtn: { position: 'relative', padding: 8 },
  notifIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#DC2626', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#059669' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  adCard: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#C7D2FE' },
  adLabel: { fontSize: 11, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  adTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  adDesc: { fontSize: 13, color: '#4338CA', marginTop: 4, lineHeight: 18 },
});
