import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { paymentsAPI } from '../../api/payments';

export default function StripeConnectScreen() {
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    try {
      const response = await paymentsAPI.getConnectAccountStatus();
      setAccountStatus(response.data);
    } catch (err) {
      console.error('Failed to load Stripe status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAccount = async () => {
    setActionLoading(true);
    try {
      const response = await paymentsAPI.createConnectAccount({});
      const { url } = response.data;
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start setup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setActionLoading(true);
    try {
      const response = await paymentsAPI.getConnectDashboardLink();
      await Linking.openURL(response.data.url);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to open dashboard');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const isConnected = accountStatus?.connected;
  const isReady = accountStatus?.payoutsEnabled && accountStatus?.chargesEnabled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Payouts</Text>
        <Text style={styles.subtitle}>Manage your Stripe account to receive ride payments</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>
            {isReady ? '✅' : isConnected ? '⏳' : '💳'}
          </Text>
          <View>
            <Text style={styles.statusTitle}>
              {isReady ? 'Account Ready' : isConnected ? 'Setup Incomplete' : 'Not Connected'}
            </Text>
            <Text style={styles.statusDesc}>
              {isReady
                ? 'You can receive payouts for completed rides.'
                : isConnected
                  ? 'Complete your Stripe onboarding to receive payouts.'
                  : 'Connect your Stripe account to receive ride payments.'}
            </Text>
          </View>
        </View>

        {isConnected && (
          <View style={styles.checkList}>
            <CheckItem label="Account created" checked />
            <CheckItem label="Details submitted" checked={accountStatus?.detailsSubmitted} />
            <CheckItem label="Charges enabled" checked={accountStatus?.chargesEnabled} />
            <CheckItem label="Payouts enabled" checked={accountStatus?.payoutsEnabled} />
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Driver Payouts Work</Text>
        <InfoRow icon="💰" text="Passengers pay before the ride starts" />
        <InfoRow icon="🔒" text="Funds are held securely in escrow" />
        <InfoRow icon="🚗" text="You complete the ride" />
        <InfoRow icon="💸" text="Funds are released to your account (minus 1% platform fee)" />
        <InfoRow icon="🏦" text="Stripe deposits funds to your bank (typically 2 business days)" />
      </View>

      {!isConnected && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSetupAccount}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Set Up Stripe Account</Text>
          )}
        </TouchableOpacity>
      )}

      {isConnected && !isReady && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSetupAccount}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      )}

      {isReady && (
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={handleOpenDashboard}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#4F46E5" />
          ) : (
            <Text style={styles.dashboardButtonText}>Open Stripe Dashboard</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => { setLoading(true); loadAccountStatus(); }}
      >
        <Text style={styles.refreshButtonText}>Refresh Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CheckItem({ label, checked }) {
  return (
    <View style={styles.checkRow}>
      <Text style={styles.checkIcon}>{checked ? '✓' : '○'}</Text>
      <Text style={[styles.checkLabel, checked && styles.checkLabelDone]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  statusIcon: { fontSize: 32 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statusDesc: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  checkList: { marginTop: 16, gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { fontSize: 16, fontWeight: '700', color: '#4F46E5', width: 20, textAlign: 'center' },
  checkLabel: { fontSize: 14, color: '#6B7280' },
  checkLabelDone: { color: '#111827', fontWeight: '500' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dashboardButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  dashboardButtonText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  refreshButton: { alignItems: 'center', paddingVertical: 12 },
  refreshButtonText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },
});
