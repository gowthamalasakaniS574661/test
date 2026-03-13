import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', role: 'passenger',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the ride-sharing marketplace</Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.halfInput]} placeholder="First Name" placeholderTextColor="#9CA3AF" value={form.firstName} onChangeText={(v) => updateField('firstName', v)} />
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Last Name" placeholderTextColor="#9CA3AF" value={form.lastName} onChangeText={(v) => updateField('lastName', v)} />
          </View>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" value={form.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#9CA3AF" value={form.password} onChangeText={(v) => updateField('password', v)} secureTextEntry />
          <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor="#9CA3AF" value={form.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />

          <Text style={styles.label}>I want to:</Text>
          <View style={styles.roleRow}>
            {[
              { key: 'passenger', label: 'Ride' },
              { key: 'driver', label: 'Drive' },
              { key: 'both', label: 'Both' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.roleButton, form.role === option.key && styles.roleButtonActive]}
                onPress={() => updateField('role', option.key)}
              >
                <Text style={[styles.roleText, form.role === option.key && styles.roleTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleButton: {
    flex: 1, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  roleTextActive: { color: '#4F46E5' },
  button: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#6B7280', marginTop: 16, fontSize: 14 },
  linkBold: { color: '#4F46E5', fontWeight: '600' },
});
