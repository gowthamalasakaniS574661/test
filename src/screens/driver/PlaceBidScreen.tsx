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
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface PlaceBidScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

const REQUEST_DETAILS = {
  passengerName: 'Sarah Johnson',
  passengerRating: 4.8,
  totalTrips: 56,
  pickup: '123 Main Street',
  dropoff: 'Downtown Office',
  distance: '12.5 km',
  estimatedDuration: '20 min',
  dateTime: 'Today, 8:30 AM',
  seats: 1,
  notes: 'Would prefer a quiet ride. Have one small suitcase.',
  currentBids: 3,
  priceRange: { low: 18, high: 30 },
};

export const PlaceBidScreen: React.FC<PlaceBidScreenProps> = ({ onBack, onSubmit }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [message, setMessage] = useState('');
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
        <Text style={styles.headerTitle}>Place a Bid</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Request Details */}
        <Card style={styles.requestCard}>
          <View style={styles.passengerRow}>
            <View style={styles.passengerAvatar}>
              <Ionicons name="person" size={22} color={Colors.white} />
            </View>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>{REQUEST_DETAILS.passengerName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={Colors.star} />
                <Text style={styles.ratingText}>
                  {REQUEST_DETAILS.passengerRating} · {REQUEST_DETAILS.totalTrips} trips
                </Text>
              </View>
            </View>
            <Badge
              label={`${REQUEST_DETAILS.currentBids} BIDS`}
              backgroundColor="#FEFCBF"
              color="#B7791F"
            />
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeDots}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeLine} />
              <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
            </View>
            <View style={styles.routeLabels}>
              <Text style={styles.routeText}>{REQUEST_DETAILS.pickup}</Text>
              <Text style={styles.routeText}>{REQUEST_DETAILS.dropoff}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detailText}>{REQUEST_DETAILS.dateTime}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detailText}>{REQUEST_DETAILS.distance}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detailText}>{REQUEST_DETAILS.seats} seat</Text>
            </View>
          </View>

          {REQUEST_DETAILS.notes && (
            <View style={styles.notesBox}>
              <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.notesText}>{REQUEST_DETAILS.notes}</Text>
            </View>
          )}
        </Card>

        {/* Bid Amount */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Your Bid</Text>

          <View style={styles.priceRangeRow}>
            <Text style={styles.priceRangeText}>
              Current bid range: ${REQUEST_DETAILS.priceRange.low} - ${REQUEST_DETAILS.priceRange.high}
            </Text>
          </View>

          <Input
            label="Bid Amount ($)"
            placeholder="0.00"
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="decimal-pad"
            icon={<Ionicons name="cash" size={20} color={Colors.success} />}
          />

          <View style={styles.quickBidRow}>
            {[20, 23, 25, 28].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.quickBidChip,
                  bidAmount === String(amount) && styles.quickBidChipActive,
                ]}
                onPress={() => setBidAmount(String(amount))}
              >
                <Text
                  style={[
                    styles.quickBidText,
                    bidAmount === String(amount) && styles.quickBidTextActive,
                  ]}
                >
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Estimated Pickup Time"
            placeholder="e.g., 15 minutes"
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            icon={<Ionicons name="time-outline" size={20} color={Colors.textMuted} />}
          />
        </Card>

        {/* Message */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Message to Passenger</Text>
          <Text style={styles.helperText}>
            A personal note helps you stand out from other drivers
          </Text>
          <Input
            placeholder="Hi! I'll be happy to pick you up. I have a clean, comfortable car with AC..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Your Vehicle Summary */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleRow}>
            <Ionicons name="car" size={24} color={Colors.primary} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>Your Vehicle</Text>
              <Text style={styles.vehicleText}>Toyota Camry 2022 · Black</Text>
              <Text style={styles.vehiclePlate}>ABC-1234</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Submit Bid"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitButton}
          icon={<Ionicons name="pricetag" size={20} color={Colors.white} />}
        />

        <Text style={styles.disclaimer}>
          Your bid will be visible to the passenger. You can modify or withdraw it until accepted.
        </Text>
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
  requestCard: {
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  passengerName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  routeDots: {
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  routeLabels: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  notesText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  priceRangeRow: {
    backgroundColor: '#EBF4FF',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  priceRangeText: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickBidRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  quickBidChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickBidChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF4FF',
  },
  quickBidText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickBidTextActive: {
    color: Colors.primary,
  },
  helperText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  vehicleCard: {
    marginBottom: Spacing.lg,
    backgroundColor: '#EBF4FF',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  vehicleText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  vehiclePlate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  submitButton: {
    marginBottom: Spacing.md,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
