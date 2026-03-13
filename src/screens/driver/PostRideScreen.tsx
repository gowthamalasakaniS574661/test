import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface PostRideScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

export const PostRideScreen: React.FC<PostRideScreenProps> = ({ onBack, onSubmit }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState('');
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'van'>('sedan');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleOptions = [
    { key: 'sedan' as const, icon: 'car-sport', label: 'Sedan' },
    { key: 'suv' as const, icon: 'car', label: 'SUV' },
    { key: 'van' as const, icon: 'bus', label: 'Van' },
  ];

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Ride</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Route */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Route</Text>
          <View style={styles.routeInputs}>
            <View style={styles.routeIndicator}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeLine} />
              <View style={[styles.routeDot, { backgroundColor: Colors.dangerDark }]} />
            </View>
            <View style={styles.routeFields}>
              <Input
                placeholder="Starting point"
                value={origin}
                onChangeText={setOrigin}
                containerStyle={styles.routeInput}
                icon={<Ionicons name="navigate" size={18} color={Colors.success} />}
              />
              <Input
                placeholder="Destination"
                value={destination}
                onChangeText={setDestination}
                containerStyle={styles.routeInput}
                icon={<Ionicons name="flag" size={18} color={Colors.dangerDark} />}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.addStopButton}>
            <Ionicons name="add" size={18} color={Colors.primaryLight} />
            <Text style={styles.addStopText}>Add a stop</Text>
          </TouchableOpacity>
        </Card>

        {/* Schedule */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule</Text>
          <View style={styles.dateTimeRow}>
            <Input
              placeholder="Date"
              value={date}
              onChangeText={setDate}
              containerStyle={styles.dateInput}
              icon={<Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />}
            />
            <Input
              placeholder="Time"
              value={time}
              onChangeText={setTime}
              containerStyle={styles.timeInput}
              icon={<Ionicons name="time-outline" size={18} color={Colors.textMuted} />}
            />
          </View>

          <View style={styles.recurringRow}>
            <Ionicons name="repeat" size={18} color={Colors.textSecondary} />
            <Text style={styles.recurringText}>Set as recurring ride</Text>
            <TouchableOpacity style={styles.recurringToggle}>
              <View style={styles.toggleTrack}>
                <View style={styles.toggleThumb} />
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Vehicle & Seats */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Vehicle Type</Text>
          <View style={styles.vehicleRow}>
            {vehicleOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.vehicleOption,
                  vehicleType === opt.key && styles.vehicleOptionSelected,
                ]}
                onPress={() => setVehicleType(opt.key)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={28}
                  color={vehicleType === opt.key ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.vehicleLabel,
                    vehicleType === opt.key && styles.vehicleLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Available Seats</Text>
          <View style={styles.seatPicker}>
            <TouchableOpacity
              style={styles.seatButton}
              onPress={() => setSeats(Math.max(1, seats - 1))}
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.seatCountContainer}>
              <Text style={styles.seatCount}>{seats}</Text>
              <Text style={styles.seatLabel}>{seats === 1 ? 'seat' : 'seats'}</Text>
            </View>
            <TouchableOpacity
              style={styles.seatButton}
              onPress={() => setSeats(Math.min(8, seats + 1))}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Pricing */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Price per Seat</Text>
          <Input
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            icon={<Ionicons name="cash-outline" size={18} color={Colors.textMuted} />}
          />
          <View style={styles.suggestedPrices}>
            {['$15', '$20', '$25', '$30'].map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.suggestedChip}
                onPress={() => setPrice(p.replace('$', ''))}
              >
                <Text style={styles.suggestedText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notes */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Additional Info</Text>
          <Input
            placeholder="Luggage space, pet-friendly, music preferences..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Button
          title="Publish Ride"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitButton}
          icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  routeInputs: {
    flexDirection: 'row',
  },
  routeIndicator: {
    alignItems: 'center',
    paddingTop: Spacing.lg + 4,
    marginRight: Spacing.sm,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.border,
  },
  routeFields: {
    flex: 1,
  },
  routeInput: {
    marginBottom: Spacing.sm,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  addStopText: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  recurringText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recurringToggle: {
    padding: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  vehicleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF4FF',
  },
  vehicleLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  vehicleLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  seatPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCountContainer: {
    alignItems: 'center',
  },
  seatCount: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.primary,
  },
  seatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  suggestedPrices: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  suggestedChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestedText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
