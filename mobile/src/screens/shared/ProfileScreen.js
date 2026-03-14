import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { TrustScoreCard } from '../../components/trust';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <Text style={styles.role}>{user.role}</Text>

      <TouchableOpacity
        style={styles.trustScoreContainer}
        onPress={() => navigation.navigate('TrustScore')}
        activeOpacity={0.7}
      >
        <TrustScoreCard
          score={user.trustScore || user.trustBreakdown?.overallScore || 5.00}
          totalRatings={user.totalRatings || 0}
        />
        <Text style={styles.viewBreakdown}>Tap to view breakdown →</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Verified</Text>
          <Text style={[styles.infoValue, { color: user.isVerified ? '#059669' : '#D97706' }]}>
            {user.isVerified ? 'Yes' : 'Pending'}
          </Text>
        </View>
      </View>

      {user.driverProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <Text style={styles.vehicleText}>
            {user.driverProfile.vehicleColor} {user.driverProfile.vehicleYear} {user.driverProfile.vehicleMake} {user.driverProfile.vehicleModel}
          </Text>
          <Text style={styles.vehiclePlate}>{user.driverProfile.vehiclePlate}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SOS')}>
          <Text style={styles.menuIcon}>🚨</Text>
          <Text style={styles.menuLabel}>Emergency SOS & Contacts</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TripHistory')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuLabel}>Trip History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        {(user.role === 'driver' || user.role === 'both') && (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Documents')}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuLabel}>Driver Documents</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {(user.role === 'driver' || user.role === 'both') && (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('Payments', { screen: 'StripeConnect' })}
        >
          <Text style={styles.connectButtonText}>💳 Setup Payouts (Stripe)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: '#111827' },
  role: { fontSize: 14, color: '#6B7280', textTransform: 'capitalize', marginBottom: 20 },
  trustScoreContainer: { width: '100%', marginBottom: 16 },
  viewBreakdown: { fontSize: 13, color: '#4F46E5', fontWeight: '600', textAlign: 'center', marginTop: 8 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  vehicleText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  vehiclePlate: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#374151' },
  menuArrow: { fontSize: 20, color: '#9CA3AF' },
  connectButton: { width: '100%', marginTop: 12, backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: { width: '100%', marginTop: 12, borderWidth: 2, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
