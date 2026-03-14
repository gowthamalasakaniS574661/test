import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Vibration,
} from 'react-native';
import * as Location from 'expo-location';
import { safetyAPI } from '../../api/safety';

export default function SOSScreen({ route }) {
  const bookingId = route?.params?.bookingId;
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [alertId, setAlertId] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await safetyAPI.getEmergencyContacts();
      setContacts(res.data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContacts = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    const updated = [...contacts, newContact];
    try {
      await safetyAPI.setEmergencyContacts(updated);
      setNewContact({ name: '', phone: '', relationship: '' });
      setShowAddContact(false);
      loadContacts();
    } catch (err) {
      Alert.alert('Error', 'Failed to save contacts');
    }
  };

  const handleRemoveContact = async (idx) => {
    const updated = contacts.filter((_, i) => i !== idx);
    try {
      if (updated.length > 0) {
        await safetyAPI.setEmergencyContacts(updated);
      }
      loadContacts();
    } catch (err) {
      Alert.alert('Error', 'Failed to update contacts');
    }
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert your emergency contacts with your current location. Continue?',
      [
        { text: 'Cancel' },
        { text: 'SEND SOS', style: 'destructive', onPress: triggerSOS },
      ]
    );
  };

  const triggerSOS = async () => {
    setTriggering(true);
    Vibration.vibrate([0, 200, 100, 200]);

    try {
      let latitude = null;
      let longitude = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      } catch {
        // Continue without location
      }

      const res = await safetyAPI.triggerSOS({
        bookingId: bookingId || null,
        latitude,
        longitude,
        alertType: 'sos',
      });

      setSosTriggered(true);
      setAlertId(res.data.alert.id);

      Alert.alert(
        'SOS Sent',
        `Emergency alert sent. ${res.data.alert.contactsNotified} contact(s) notified.`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send SOS. Please call emergency services directly.');
    } finally {
      setTriggering(false);
    }
  };

  const handleResolve = async () => {
    if (!alertId) return;
    try {
      await safetyAPI.resolveAlert(alertId, { status: 'resolved' });
      setSosTriggered(false);
      setAlertId(null);
      Alert.alert('Resolved', 'SOS alert marked as resolved.');
    } catch (err) {
      Alert.alert('Error', 'Failed to resolve alert');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#DC2626" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SOS Button */}
      <View style={styles.sosSection}>
        {sosTriggered ? (
          <View style={styles.sosActiveCard}>
            <Text style={styles.sosActiveIcon}>🚨</Text>
            <Text style={styles.sosActiveTitle}>SOS Alert Active</Text>
            <Text style={styles.sosActiveText}>
              Your emergency contacts have been notified with your location.
            </Text>
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleSOS}
            disabled={triggering}
            activeOpacity={0.8}
          >
            {triggering ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Text style={styles.sosIcon}>🚨</Text>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubtext}>Tap for Emergency</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Text style={styles.sectionDesc}>
          These contacts will be notified with your location when you trigger SOS.
        </Text>

        {contacts.map((c, idx) => (
          <View key={idx} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>
                {c.name} {c.isPrimary && <Text style={styles.primaryBadge}>(Primary)</Text>}
              </Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
              {c.relationship && (
                <Text style={styles.contactRelation}>{c.relationship}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleRemoveContact(idx)}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {showAddContact ? (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#9CA3AF"
              value={newContact.name}
              onChangeText={(v) => setNewContact((p) => ({ ...p, name: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#9CA3AF"
              value={newContact.phone}
              onChangeText={(v) => setNewContact((p) => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Relationship (optional)"
              placeholderTextColor="#9CA3AF"
              value={newContact.relationship}
              onChangeText={(v) => setNewContact((p) => ({ ...p, relationship: v }))}
            />
            <View style={styles.addFormActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContacts}>
                <Text style={styles.saveBtnText}>Save Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddContact(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addContactBtn} onPress={() => setShowAddContact(true)}>
            <Text style={styles.addContactBtnText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Safety tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Safety Tips</Text>
        <Text style={styles.tip}>• Share your ride with a trusted contact before departing</Text>
        <Text style={styles.tip}>• Verify the driver's identity and vehicle before boarding</Text>
        <Text style={styles.tip}>• Keep your phone charged and location services on</Text>
        <Text style={styles.tip}>• Trust your instincts — cancel if something feels wrong</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sosSection: { alignItems: 'center', marginBottom: 24 },
  sosButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  sosIcon: { fontSize: 40 },
  sosText: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 },
  sosSubtext: { color: '#FCA5A5', fontSize: 13, fontWeight: '500', marginTop: 2 },
  sosActiveCard: {
    backgroundColor: '#FEE2E2', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%',
    borderWidth: 2, borderColor: '#DC2626',
  },
  sosActiveIcon: { fontSize: 40, marginBottom: 8 },
  sosActiveTitle: { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  sosActiveText: { fontSize: 14, color: '#7F1D1D', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  resolveBtn: { marginTop: 16, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  resolveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  primaryBadge: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  contactPhone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  contactRelation: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  removeBtn: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  addForm: { gap: 8, marginTop: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  addFormActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelText: { color: '#6B7280', fontSize: 14 },
  addContactBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginTop: 4 },
  addContactBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
  tipsCard: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16 },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: '#4338CA', marginBottom: 10 },
  tip: { fontSize: 13, color: '#4338CA', opacity: 0.85, lineHeight: 22 },
});
