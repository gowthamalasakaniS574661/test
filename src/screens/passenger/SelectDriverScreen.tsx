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
import { StarRating } from '../../components/StarRating';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface SelectDriverScreenProps {
  onBack: () => void;
  onConfirm: () => void;
}

const SELECTED_BID = {
  id: 'bid-1',
  driverName: 'Michael Chen',
  driverRating: 4.9,
  driverTrips: 342,
  price: 25.0,
  estimatedTime: '18 min',
  vehicleInfo: 'Toyota Camry 2022 · Black',
  plate: 'ABC-1234',
  message: 'I can pick you up right on time. AC available.',
  memberSince: 'Jan 2023',
  completionRate: '98%',
};

const RIDE_DETAILS = {
  pickup: '123 Main Street',
  dropoff: 'Downtown Office',
  date: 'Today, 8:30 AM',
  seats: 1,
  distance: '12.5 km',
};

export const SelectDriverScreen: React.FC<SelectDriverScreenProps> = ({ onBack, onConfirm }) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm();
    }, 2000);
  };

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationOverlay}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </View>
          <Text style={styles.confirmTitle}>Ride Confirmed!</Text>
          <Text style={styles.confirmSubtitle}>
            {SELECTED_BID.driverName} is on the way
          </Text>
          <Text style={styles.confirmEta}>Estimated arrival: {SELECTED_BID.estimatedTime}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Driver</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Driver Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={36} color={Colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.driverName}>{SELECTED_BID.driverName}</Text>
              <View style={styles.ratingRow}>
                <StarRating rating={SELECTED_BID.driverRating} size={16} />
                <Text style={styles.ratingText}>{SELECTED_BID.driverRating}</Text>
              </View>
              <Text style={styles.tripsText}>{SELECTED_BID.driverTrips} trips completed</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{SELECTED_BID.completionRate}</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{SELECTED_BID.memberSince}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{SELECTED_BID.driverRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </Card>

        {/* Vehicle Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            <Ionicons name="car" size={24} color={Colors.primary} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>{SELECTED_BID.vehicleInfo}</Text>
              <Text style={styles.plateText}>Plate: {SELECTED_BID.plate}</Text>
            </View>
          </View>
        </Card>

        {/* Ride Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Ride Summary</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeDots}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeLine} />
              <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
            </View>
            <View style={styles.routeLabels}>
              <Text style={styles.routeText}>{RIDE_DETAILS.pickup}</Text>
              <Text style={styles.routeText}>{RIDE_DETAILS.dropoff}</Text>
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailText}>{RIDE_DETAILS.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailText}>{RIDE_DETAILS.seats} seat</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailText}>{RIDE_DETAILS.distance}</Text>
            </View>
          </View>
        </Card>

        {/* Price */}
        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Fare</Text>
            <Text style={styles.priceValue}>${SELECTED_BID.price.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.etaLabel}>Estimated Time</Text>
            <Text style={styles.etaValue}>{SELECTED_BID.estimatedTime}</Text>
          </View>
        </Card>

        {SELECTED_BID.message && (
          <Card style={styles.messageCard}>
            <View style={styles.messageRow}>
              <Ionicons name="chatbubble" size={16} color={Colors.accent} />
              <Text style={styles.messageLabel}>Driver's Message</Text>
            </View>
            <Text style={styles.messageText}>{SELECTED_BID.message}</Text>
          </Card>
        )}

        <Button
          title="Confirm & Book Ride"
          onPress={handleConfirm}
          size="lg"
          style={styles.confirmButton}
          icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
        />

        <Button
          title="Go Back to Bids"
          onPress={onBack}
          variant="outline"
          size="md"
          style={styles.backButtonBottom}
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
  confirmationOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  confirmSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  confirmEta: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: '600',
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  driverName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 4,
  },
  ratingText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tripsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
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
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  plateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  priceCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryDark,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  priceValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  etaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.7,
  },
  etaValue: {
    fontSize: FontSize.md,
    color: Colors.accentLight,
    fontWeight: '600',
  },
  messageCard: {
    marginBottom: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  messageLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  confirmButton: {
    marginBottom: Spacing.md,
  },
  backButtonBottom: {
    marginBottom: Spacing.lg,
  },
});
