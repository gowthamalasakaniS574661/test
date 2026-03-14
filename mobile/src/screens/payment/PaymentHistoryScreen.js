import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { paymentsAPI } from '../../api/payments';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_CONFIG = {
  pending: { color: '#FEF3C7', textColor: '#D97706', label: 'Pending' },
  escrow: { color: '#DBEAFE', textColor: '#2563EB', label: 'In Escrow' },
  processing: { color: '#FEF3C7', textColor: '#D97706', label: 'Processing' },
  completed: { color: '#D1FAE5', textColor: '#059669', label: 'Completed' },
  failed: { color: '#FEE2E2', textColor: '#DC2626', label: 'Failed' },
  refunded: { color: '#F3F4F6', textColor: '#6B7280', label: 'Refunded' },
};

export default function PaymentHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsAPI.getMyPayments();
      setPayments(response.data.payments);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPayments(); }, [fetchPayments]));

  const renderPayment = ({ item }) => {
    const isIncoming = item.payeeId === user?.id;
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PaymentDetail', { bookingId: item.bookingId })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.amountLabel}>
              {isIncoming ? 'Received' : 'Paid'}
            </Text>
            <Text style={[styles.amount, isIncoming && styles.amountIncoming]}>
              {isIncoming ? '+' : '-'}${parseFloat(isIncoming ? item.driverAmount || item.amount : item.amount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color }]}>
            <Text style={[styles.statusText, { color: statusCfg.textColor }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {item.rideRoute && (
          <Text style={styles.route} numberOfLines={1}>{item.rideRoute}</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.meta}>
            {isIncoming ? `From: ${item.payerName}` : `To: ${item.payeeName}`}
          </Text>
          <Text style={styles.meta}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.platformFee > 0 && isIncoming && (
          <Text style={styles.feeText}>
            Platform fee: ${parseFloat(item.platformFee).toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const totalEarnings = payments
    .filter((p) => p.payeeId === user?.id && p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.driverAmount || p.amount), 0);

  const totalSpent = payments
    .filter((p) => p.payerId === user?.id && p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const inEscrow = payments
    .filter((p) => p.status === 'escrow')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        {totalEarnings > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Earned</Text>
          </View>
        )}
        {totalSpent > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Spent</Text>
          </View>
        )}
        {inEscrow > 0 && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.escrowValue]}>${inEscrow.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>In Escrow</Text>
          </View>
        )}
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPayments(); }}
            tintColor="#4F46E5"
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No payment history yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  escrowValue: { color: '#2563EB' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  amountLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  amount: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  amountIncoming: { color: '#059669' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  route: { fontSize: 14, color: '#374151', marginBottom: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  meta: { fontSize: 13, color: '#9CA3AF' },
  feeText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
