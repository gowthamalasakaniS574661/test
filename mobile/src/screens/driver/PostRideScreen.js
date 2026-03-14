import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import { ridesAPI } from '../../api/rides';
import { LocationPicker } from '../../components/map';

export default function PostRideScreen({ navigation }) {
  const [form, setForm] = useState({
    originAddress: '', destinationAddress: '', departureTime: '',
    availableSeats: '3', basePrice: '', pricePerSeat: '',
    allowBidding: true, minBidPrice: '', description: '',
    originLocation: null, destinationLocation: null,
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleOriginSelect = (location) => {
    setForm((prev) => ({
      ...prev,
      originLocation: location,
      originAddress: location.address || prev.originAddress,
    }));
  };

  const handleDestinationSelect = (location) => {
    setForm((prev) => ({
      ...prev,
      destinationLocation: location,
      destinationAddress: location.address || prev.destinationAddress,
    }));
  };

  const handlePost = async () => {
    if (!form.originAddress || !form.destinationAddress || !form.departureTime || !form.basePrice || !form.pricePerSeat) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        originAddress: form.originAddress,
        destinationAddress: form.destinationAddress,
        departureTime: new Date(form.departureTime).toISOString(),
        availableSeats: parseInt(form.availableSeats, 10),
        basePrice: parseFloat(form.basePrice),
        pricePerSeat: parseFloat(form.pricePerSeat),
        allowBidding: form.allowBidding,
        minBidPrice: form.minBidPrice ? parseFloat(form.minBidPrice) : 0,
        description: form.description,
      };

      if (form.originLocation) {
        rideData.originLat = form.originLocation.latitude;
        rideData.originLng = form.originLocation.longitude;
      }
      if (form.destinationLocation) {
        rideData.destinationLat = form.destinationLocation.latitude;
        rideData.destinationLng = form.destinationLocation.longitude;
      }

      await ridesAPI.createRide(rideData);
      Alert.alert('Success', 'Ride posted!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Post a Ride</Text>

      <LocationPicker
        label="Pickup Location"
        value={form.originLocation}
        onLocationSelect={handleOriginSelect}
        markerColor="#4F46E5"
      />

      <LocationPicker
        label="Destination"
        value={form.destinationLocation}
        onLocationSelect={handleDestinationSelect}
        markerColor="#EF4444"
      />

      <Text style={styles.label}>Departure Time * (YYYY-MM-DD HH:MM)</Text>
      <TextInput style={styles.input} placeholder="2026-03-15 09:00" placeholderTextColor="#9CA3AF" value={form.departureTime} onChangeText={(v) => updateField('departureTime', v)} />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Available Seats *</Text>
          <TextInput style={styles.input} placeholder="3" placeholderTextColor="#9CA3AF" value={form.availableSeats} onChangeText={(v) => updateField('availableSeats', v)} keyboardType="number-pad" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Price/Seat ($) *</Text>
          <TextInput style={styles.input} placeholder="15.00" placeholderTextColor="#9CA3AF" value={form.pricePerSeat} onChangeText={(v) => updateField('pricePerSeat', v)} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={styles.label}>Base Price ($) *</Text>
      <TextInput style={styles.input} placeholder="25.00" placeholderTextColor="#9CA3AF" value={form.basePrice} onChangeText={(v) => updateField('basePrice', v)} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Allow Bidding</Text>
        <Switch value={form.allowBidding} onValueChange={(v) => updateField('allowBidding', v)} trackColor={{ true: '#4F46E5' }} />
      </View>

      {form.allowBidding && (
        <>
          <Text style={styles.label}>Minimum Bid Price ($)</Text>
          <TextInput style={styles.input} placeholder="10.00" placeholderTextColor="#9CA3AF" value={form.minBidPrice} onChangeText={(v) => updateField('minBidPrice', v)} keyboardType="decimal-pad" />
        </>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your ride (AC, music, etc.)" placeholderTextColor="#9CA3AF" value={form.description} onChangeText={(v) => updateField('description', v)} multiline numberOfLines={4} />

      <TouchableOpacity style={styles.button} onPress={handlePost} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Ride</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  button: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
