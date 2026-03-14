import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { reportsAPI } from '../../api/reports';

const REASONS = [
  { key: 'harassment', label: 'Harassment', icon: '🚫' },
  { key: 'unsafe_driving', label: 'Unsafe Driving', icon: '⚠️' },
  { key: 'fraud', label: 'Fraud', icon: '🕵️' },
  { key: 'no_show', label: 'No Show', icon: '👻' },
  { key: 'inappropriate', label: 'Inappropriate Behavior', icon: '😤' },
  { key: 'spam', label: 'Spam', icon: '📧' },
  { key: 'other', label: 'Other', icon: '📝' },
];

export default function ReportUserScreen({ route, navigation }) {
  const { reportedUserId, bookingId, rideId } = route.params || {};
  const [reason, setReason] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { Alert.alert('Error', 'Please select a reason'); return; }
    setSubmitting(true);
    try {
      await reportsAPI.createReport({
        reportedUserId, bookingId, rideId,
        reason, description: description.trim() || undefined,
      });
      Alert.alert('Report Submitted', 'We will review your report within 24-48 hours.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report an Issue</Text>
      <Text style={styles.subtitle}>Select the reason for your report</Text>

      <View style={styles.reasonList}>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.reasonItem, reason === r.key && styles.reasonSelected]}
            onPress={() => setReason(r.key)}
          >
            <Text style={styles.reasonIcon}>{r.icon}</Text>
            <Text style={[styles.reasonLabel, reason === r.key && styles.reasonLabelSelected]}>{r.label}</Text>
            {reason === r.key && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.descLabel}>Additional details (optional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe what happened..."
        placeholderTextColor="#9CA3AF"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Submit Report</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  reasonList: { gap: 8, marginBottom: 20 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  reasonSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  reasonIcon: { fontSize: 20 },
  reasonLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#374151' },
  reasonLabelSelected: { color: '#4F46E5', fontWeight: '600' },
  checkmark: { color: '#4F46E5', fontSize: 18, fontWeight: '700' },
  descLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
