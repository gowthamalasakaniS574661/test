import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsAPI } from '../../api/payments';

export default function EarningsScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    try {
      const res = await paymentsAPI.getMyPayments();
      setPayments((res.data.payments || []).filter((p) => p.payeeId === user?.id));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const completed = payments.filter((p) => p.status === 'completed');
  const escrow = payments.filter((p) => p.status === 'escrow');
  const totalEarned = completed.reduce((s, p) => s + parseFloat(p.driverAmount || p.amount), 0);
  const totalFees = completed.reduce((s, p) => s + parseFloat(p.platformFee || 0), 0);
  const inEscrow = escrow.reduce((s, p) => s + parseFloat(p.driverAmount || p.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalEarned.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>${inEscrow.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>In Escrow</Text>
          </View>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeText}>Platform fees paid: ${totalFees.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.listTitle}>Payment History</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>+${parseFloat(item.driverAmount || item.amount).toFixed(2)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#D1FAE5' : '#DBEAFE' }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {item.rideRoute && <Text style={styles.paymentRoute}>{item.rideRoute}</Text>}
            <Text style={styles.paymentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No earnings yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { backgroundColor: '#059669', margin: 16, borderRadius: 16, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 13, color: '#D1FAE5', marginTop: 4 },
  feeRow: { marginTop: 12, alignItems: 'center' },
  feeText: { fontSize: 12, color: '#A7F3D0' },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentAmount: { fontSize: 20, fontWeight: '800', color: '#059669' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  paymentRoute: { fontSize: 13, color: '#374151', marginTop: 6 },
  paymentDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
