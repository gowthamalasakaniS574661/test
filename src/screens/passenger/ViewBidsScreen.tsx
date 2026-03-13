import React from 'react';
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
import { Badge } from '../../components/Badge';
import { StarRating } from '../../components/StarRating';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';
import { Bid } from '../../types';

interface ViewBidsScreenProps {
  onBack: () => void;
  onSelectBid: (bidId: string) => void;
}

const MOCK_BIDS: Bid[] = [
  {
    id: 'bid-1',
    driverId: 'd1',
    driverName: 'Michael Chen',
    driverRating: 4.9,
    driverTrips: 342,
    price: 25.0,
    estimatedTime: '18 min',
    vehicleInfo: 'Toyota Camry 2022 · Black',
    message: 'I can pick you up right on time. AC available.',
    status: 'pending',
  },
  {
    id: 'bid-2',
    driverId: 'd2',
    driverName: 'Priya Sharma',
    driverRating: 4.8,
    driverTrips: 215,
    price: 22.5,
    estimatedTime: '22 min',
    vehicleInfo: 'Honda Civic 2023 · Silver',
    message: 'Happy to help! Comfortable ride guaranteed.',
    status: 'pending',
  },
  {
    id: 'bid-3',
    driverId: 'd3',
    driverName: 'James Wilson',
    driverRating: 4.7,
    driverTrips: 128,
    price: 20.0,
    estimatedTime: '25 min',
    vehicleInfo: 'Hyundai Sonata 2021 · White',
    status: 'pending',
  },
  {
    id: 'bid-4',
    driverId: 'd4',
    driverName: 'Anna Rodriguez',
    driverRating: 5.0,
    driverTrips: 89,
    price: 28.0,
    estimatedTime: '15 min',
    vehicleInfo: 'BMW 3 Series 2023 · Blue',
    message: 'Premium comfort ride. Closest to your location.',
    status: 'pending',
  },
];

export const ViewBidsScreen: React.FC<ViewBidsScreenProps> = ({ onBack, onSelectBid }) => {
  const sortedBids = [...MOCK_BIDS].sort((a, b) => b.driverRating - a.driverRating);
  const bestValue = [...MOCK_BIDS].sort((a, b) => a.price - b.price)[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Bids Received</Text>
          <Text style={styles.headerSubtitle}>{MOCK_BIDS.length} drivers responded</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Ride Summary */}
      <View style={styles.rideSummary}>
        <View style={styles.routeContainer}>
          <View style={styles.routeDots}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <View style={styles.routeLine} />
            <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
          </View>
          <View style={styles.routeLabels}>
            <Text style={styles.routeText}>Home - 123 Main Street</Text>
            <Text style={styles.routeText}>Downtown Office</Text>
          </View>
        </View>
        <Text style={styles.rideMeta}>Today, 8:30 AM · 1 seat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sortedBids.map((bid) => (
          <Card key={bid.id} style={styles.bidCard}>
            {bid.id === bestValue.id && (
              <Badge
                label="BEST VALUE"
                backgroundColor="#C6F6D5"
                color="#276749"
                style={styles.bestBadge}
              />
            )}
            <View style={styles.bidHeader}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={Colors.white} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{bid.driverName}</Text>
                <View style={styles.ratingRow}>
                  <StarRating rating={bid.driverRating} size={14} />
                  <Text style={styles.ratingText}>{bid.driverRating}</Text>
                  <Text style={styles.tripsText}>· {bid.driverTrips} trips</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${bid.price.toFixed(2)}</Text>
                <Text style={styles.eta}>{bid.estimatedTime}</Text>
              </View>
            </View>

            <Text style={styles.vehicleText}>
              <Ionicons name="car-outline" size={14} color={Colors.textSecondary} />{' '}
              {bid.vehicleInfo}
            </Text>

            {bid.message && (
              <View style={styles.messageBox}>
                <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.messageText}>{bid.message}</Text>
              </View>
            )}

            <Button
              title="Select Driver"
              onPress={() => onSelectBid(bid.id)}
              size="sm"
              style={styles.selectButton}
            />
          </Card>
        ))}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.white,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headerSpacer: {
    flex: 1,
  },
  rideSummary: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  routeContainer: {
    flexDirection: 'row',
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
  rideMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  bidCard: {
    marginBottom: Spacing.md,
  },
  bestBadge: {
    marginBottom: Spacing.sm,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tripsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  eta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehicleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  messageText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  selectButton: {
    alignSelf: 'stretch',
  },
});
