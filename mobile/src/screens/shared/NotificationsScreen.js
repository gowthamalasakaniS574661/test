import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsAPI } from '../../api/notifications';

const TYPE_ICONS = {
  bid_received: '💬', bid_accepted: '✅', bid_rejected: '❌',
  booking_confirmed: '📋', ride_started: '🚗', ride_completed: '🏁',
  payment_received: '💰', payment_failed: '⚠️', rating_received: '⭐',
  document_approved: '📄', document_rejected: '📄', sos_alert: '🚨',
  cancellation: '🚫', admin_message: '📢', promo: '🎉',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationsAPI.getNotifications();
      setNotifications(res.data.notifications);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleTap = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationsAPI.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      } catch { /* ignore */ }
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handleTap(item)}
          >
            <Text style={styles.icon}>{TYPE_ICONS[item.type] || '📌'}</Text>
            <View style={styles.textContainer}>
              <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
              {item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4F46E5" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
      />
    </View>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAllBtn: { padding: 12, alignItems: 'flex-end' },
  markAllText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardUnread: { backgroundColor: '#EEF2FF', borderLeftWidth: 3, borderLeftColor: '#4F46E5' },
  icon: { fontSize: 24 },
  textContainer: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: '#374151' },
  titleUnread: { fontWeight: '700', color: '#111827' },
  body: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});
