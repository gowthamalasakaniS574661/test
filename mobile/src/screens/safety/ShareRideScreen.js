import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Share,
} from 'react-native';
import { safetyAPI } from '../../api/safety';

export default function ShareRideScreen({ route }) {
  const { bookingId, rideOrigin, rideDestination } = route.params;
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [shareUrl, setShareUrl] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const res = await safetyAPI.createShareLink({
        bookingId,
        recipientName: recipientName.trim() || undefined,
        recipientContact: recipientContact.trim() || undefined,
        expiresInHours: 24,
      });
      setShareUrl(res.data.shareUrl);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: `I'm sharing my ride with you for safety.\n\n` +
          `${rideOrigin || 'Pickup'} → ${rideDestination || 'Destination'}\n\n` +
          `Track my ride here: ${shareUrl}`,
        title: 'My Ride Details',
      });
    } catch {
      // Share cancelled
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔗</Text>
        <Text style={styles.title}>Share Your Ride</Text>
        <Text style={styles.subtitle}>
          Send a live tracking link to a trusted person so they can monitor your trip.
        </Text>
      </View>

      {rideOrigin && rideDestination && (
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.originDot]} />
            <Text style={styles.routeText} numberOfLines={1}>{rideOrigin}</Text>
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.destDot]} />
            <Text style={styles.routeText} numberOfLines={1}>{rideDestination}</Text>
          </View>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Recipient (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#9CA3AF"
          value={recipientName}
          onChangeText={setRecipientName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone or email"
          placeholderTextColor="#9CA3AF"
          value={recipientContact}
          onChangeText={setRecipientContact}
          keyboardType="email-address"
        />
      </View>

      {shareUrl ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>✅</Text>
          <Text style={styles.resultTitle}>Link Created!</Text>
          <Text style={styles.resultUrl} selectable>{shareUrl}</Text>
          <Text style={styles.resultExpiry}>Expires in 24 hours</Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share via...</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newLinkBtn}
            onPress={() => { setShareUrl(null); setRecipientName(''); setRecipientContact(''); }}
          >
            <Text style={styles.newLinkBtnText}>Create New Link</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreateLink}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Generate Share Link</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What gets shared?</Text>
        <Text style={styles.infoText}>• Pickup and destination addresses</Text>
        <Text style={styles.infoText}>• Driver name</Text>
        <Text style={styles.infoText}>• Ride status (active, completed, etc.)</Text>
        <Text style={styles.infoText}>• No personal financial information is shared</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  routeCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  originDot: { backgroundColor: '#4F46E5' },
  destDot: { backgroundColor: '#EF4444' },
  routeText: { flex: 1, fontSize: 14, color: '#374151' },
  formCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  createBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  resultIcon: { fontSize: 36, marginBottom: 8 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  resultUrl: { fontSize: 13, color: '#4F46E5', marginTop: 8, textAlign: 'center' },
  resultExpiry: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  shareBtn: {
    backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  newLinkBtn: { marginTop: 12 },
  newLinkBtnText: { color: '#6B7280', fontSize: 14 },
  infoCard: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 16, marginTop: 16 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#4338CA', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#4338CA', opacity: 0.85, lineHeight: 22 },
});
