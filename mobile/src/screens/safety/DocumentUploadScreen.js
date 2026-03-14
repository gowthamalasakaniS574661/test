import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { safetyAPI } from '../../api/safety';

const DOCUMENT_TYPES = [
  { key: 'drivers_license', label: "Driver's License", icon: '🪪', required: true },
  { key: 'vehicle_registration', label: 'Vehicle Registration', icon: '📋', required: true },
  { key: 'insurance', label: 'Insurance', icon: '🛡️', required: true },
  { key: 'government_id', label: 'Government ID', icon: '🆔', required: false },
  { key: 'background_check', label: 'Background Check', icon: '🔍', required: false },
];

const STATUS_STYLES = {
  pending: { bg: '#FEF3C7', color: '#D97706', label: 'Under Review' },
  approved: { bg: '#D1FAE5', color: '#059669', label: 'Approved' },
  rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  expired: { bg: '#F3F4F6', color: '#6B7280', label: 'Expired' },
};

export default function DocumentUploadScreen() {
  const [documents, setDocuments] = useState([]);
  const [missingTypes, setMissingTypes] = useState([]);
  const [allApproved, setAllApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await safetyAPI.getMyDocuments();
      setDocuments(res.data.documents);
      setMissingTypes(res.data.missingTypes);
      setAllApproved(res.data.allApproved);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (docType) => {
    if (!urlInput.trim()) {
      Alert.alert('Error', 'Please enter a document URL');
      return;
    }
    setUploading(docType);
    try {
      await safetyAPI.uploadDocument({
        documentType: docType,
        fileUrl: urlInput.trim(),
        fileName: `${docType}_${Date.now()}`,
      });
      setUrlInput('');
      setSelectedType(null);
      Alert.alert('Success', 'Document uploaded for review');
      fetchDocuments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Document', `Remove ${name}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await safetyAPI.deleteDocument(id);
          fetchDocuments();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDocuments(); }} tintColor="#4F46E5" />}
    >
      <View style={[styles.statusBanner, allApproved ? styles.bannerGreen : styles.bannerYellow]}>
        <Text style={styles.bannerIcon}>{allApproved ? '✅' : '📄'}</Text>
        <Text style={styles.bannerText}>
          {allApproved
            ? 'All required documents approved!'
            : `${missingTypes.length} required document${missingTypes.length !== 1 ? 's' : ''} missing`}
        </Text>
      </View>

      {DOCUMENT_TYPES.map((dt) => {
        const doc = documents.find((d) => d.documentType === dt.key);
        const status = doc ? STATUS_STYLES[doc.status] : null;
        const isMissing = missingTypes.includes(dt.key);

        return (
          <View key={dt.key} style={[styles.docCard, isMissing && styles.docCardMissing]}>
            <View style={styles.docHeader}>
              <Text style={styles.docIcon}>{dt.icon}</Text>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>
                  {dt.label} {dt.required && <Text style={styles.required}>*</Text>}
                </Text>
                {doc && status && (
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                )}
                {!doc && (
                  <Text style={styles.notUploaded}>Not uploaded</Text>
                )}
              </View>
              {doc && (
                <TouchableOpacity onPress={() => handleDelete(doc.id, dt.label)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {doc?.status === 'rejected' && doc.rejectionReason && (
              <Text style={styles.rejectionText}>Reason: {doc.rejectionReason}</Text>
            )}

            {selectedType === dt.key ? (
              <View style={styles.uploadForm}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="Document URL (e.g. https://...)"
                  placeholderTextColor="#9CA3AF"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                />
                <View style={styles.uploadActions}>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleUpload(dt.key)}
                    disabled={uploading === dt.key}
                  >
                    {uploading === dt.key
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.uploadBtnText}>Upload</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setSelectedType(null); setUrlInput(''); }}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setSelectedType(dt.key)}
              >
                <Text style={styles.addBtnText}>
                  {doc ? 'Replace Document' : 'Upload Document'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bannerGreen: { backgroundColor: '#D1FAE5' },
  bannerYellow: { backgroundColor: '#FEF3C7' },
  bannerIcon: { fontSize: 20 },
  bannerText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  docCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  docCardMissing: { borderWidth: 1.5, borderColor: '#FCD34D' },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { fontSize: 24 },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  required: { color: '#EF4444' },
  notUploaded: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  deleteBtn: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  rejectionText: { fontSize: 12, color: '#DC2626', marginTop: 8, marginLeft: 36 },
  uploadForm: { marginTop: 12, gap: 8 },
  urlInput: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  uploadActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelText: { color: '#6B7280', fontSize: 14 },
  addBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  addBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
});
