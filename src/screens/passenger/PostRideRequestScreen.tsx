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

interface PostRideRequestScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

export const PostRideRequestScreen: React.FC<PostRideRequestScreenProps> = ({
  onBack,
  onSubmit,
}) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
        <Text style={styles.headerTitle}>Post Ride Request</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Route Section */}
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
                placeholder="Pickup location"
                value={pickup}
                onChangeText={setPickup}
                containerStyle={styles.routeInput}
                icon={<Ionicons name="location" size={18} color={Colors.success} />}
              />
              <Input
                placeholder="Drop-off location"
                value={dropoff}
                onChangeText={setDropoff}
                containerStyle={styles.routeInput}
                icon={<Ionicons name="flag" size={18} color={Colors.dangerDark} />}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="map-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.mapButtonText}>Pick from map</Text>
          </TouchableOpacity>
        </Card>

        {/* Date & Time */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>When</Text>
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
          <View style={styles.quickDateRow}>
            {['Now', 'In 30 min', 'In 1 hour', 'Tomorrow'].map((label) => (
              <TouchableOpacity key={label} style={styles.quickDateChip}>
                <Text style={styles.quickDateText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Passengers */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Passengers</Text>
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
              onPress={() => setSeats(Math.min(6, seats + 1))}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Notes */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Additional Notes</Text>
          <Input
            placeholder="Any special requirements or preferences..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </Card>

        <Button
          title="Post Request"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitButton}
          icon={<Ionicons name="send" size={18} color={Colors.white} />}
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  mapButtonText: {
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
  quickDateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quickDateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  submitButton: {
    marginTop: Spacing.md,
  },
});
