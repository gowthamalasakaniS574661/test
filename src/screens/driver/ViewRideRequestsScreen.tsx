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
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface ViewRideRequestsScreenProps {
  onBack: () => void;
  onPlaceBid: (requestId: string) => void;
}

type FilterOption = 'all' | 'nearby' | 'high_value' | 'scheduled';

const RIDE_REQUESTS = [
  {
    id: 'req-1',
    passengerName: 'Sarah Johnson',
    passengerRating: 4.8,
    pickup: '123 Main Street',
    dropoff: 'Downtown Office',
    distance: '12.5 km',
    time: 'Today, 8:30 AM',
    seats: 1,
    bidCount: 3,
    status: 'open' as const,
  },
  {
    id: 'req-2',
    passengerName: 'Emily Davis',
    passengerRating: 4.9,
    pickup: 'Shopping Mall',
    dropoff: 'University Campus',
    distance: '8.2 km',
    time: 'Today, 10:00 AM',
    seats: 2,
    bidCount: 1,
    status: 'open' as const,
  },
  {
    id: 'req-3',
    passengerName: 'Alex Torres',
    passengerRating: 4.5,
    pickup: 'City Center',
    dropoff: 'Airport Terminal 1',
    distance: '25.0 km',
    time: 'Today, 2:00 PM',
    seats: 1,
    bidCount: 5,
    status: 'open' as const,
  },
  {
    id: 'req-4',
    passengerName: 'Lisa Wang',
    passengerRating: 5.0,
    pickup: 'Hotel Grand',
    dropoff: 'Convention Center',
    distance: '5.8 km',
    time: 'Tomorrow, 9:00 AM',
    seats: 3,
    bidCount: 0,
    status: 'open' as const,
  },
  {
    id: 'req-5',
    passengerName: 'Marcus Brown',
    passengerRating: 4.6,
    pickup: 'Train Station',
    dropoff: 'Tech Park',
    distance: '15.3 km',
    time: 'Tomorrow, 7:30 AM',
    seats: 1,
    bidCount: 2,
    status: 'open' as const,
  },
];

export const ViewRideRequestsScreen: React.FC<ViewRideRequestsScreenProps> = ({
  onBack,
  onPlaceBid,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filters: { key: FilterOption; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'nearby', label: 'Nearby', icon: 'location' },
    { key: 'high_value', label: 'High Value', icon: 'trending-up' },
    { key: 'scheduled', label: 'Scheduled', icon: 'calendar' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ride Requests</Text>
          <Text style={styles.headerSubtitle}>{RIDE_REQUESTS.length} available near you</Text>
        </View>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="funnel-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={activeFilter === filter.key ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {RIDE_REQUESTS.map((request) => (
          <Card key={request.id} style={styles.requestCard}>
            {/* Passenger Info */}
            <View style={styles.passengerRow}>
              <View style={styles.passengerAvatar}>
                <Ionicons name="person" size={20} color={Colors.white} />
              </View>
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>{request.passengerName}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={Colors.star} />
                  <Text style={styles.ratingText}>{request.passengerRating}</Text>
                </View>
              </View>
              {request.bidCount === 0 ? (
                <Badge label="NEW" backgroundColor="#C6F6D5" color="#276749" />
              ) : (
                <Text style={styles.bidCountText}>{request.bidCount} bids</Text>
              )}
            </View>

            {/* Route */}
            <View style={styles.routeContainer}>
              <View style={styles.routeDots}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <View style={styles.routeLine} />
                <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeText}>{request.pickup}</Text>
                <Text style={styles.routeText}>{request.dropoff}</Text>
              </View>
            </View>

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{request.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{request.distance}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{request.seats} seat{request.seats > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <Button
              title="Place Bid"
              onPress={() => onPlaceBid(request.id)}
              size="sm"
              icon={<Ionicons name="pricetag" size={16} color={Colors.white} />}
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
  sortButton: {
    marginLeft: 'auto',
    padding: Spacing.xs,
  },
  filterBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  requestCard: {
    marginBottom: Spacing.md,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  bidCountText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
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
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
