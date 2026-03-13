import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface DashboardScreenProps {
  onViewRequests: () => void;
  onPostRide: () => void;
  onViewEarnings: () => void;
}

const STATS = {
  todayEarnings: 142.5,
  weeklyEarnings: 856.0,
  totalTrips: 342,
  rating: 4.9,
  onlineHours: 6.5,
  acceptanceRate: 95,
};

const UPCOMING_RIDES = [
  {
    id: 'r1',
    passengerName: 'Sarah Johnson',
    pickup: '123 Main Street',
    dropoff: 'Airport Terminal 2',
    time: '2:30 PM',
    price: 35.0,
    status: 'confirmed',
  },
  {
    id: 'r2',
    passengerName: 'David Kim',
    pickup: 'Central Park',
    dropoff: 'Brooklyn Heights',
    time: '4:00 PM',
    price: 22.0,
    status: 'pending',
  },
];

const OPEN_REQUESTS = [
  {
    id: 'or1',
    passengerName: 'Emily Davis',
    route: 'Mall → University Campus',
    time: 'In 45 min',
    seats: 2,
  },
  {
    id: 'or2',
    passengerName: 'Alex Torres',
    route: 'Downtown → Suburb',
    time: 'In 1 hour',
    seats: 1,
  },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onViewRequests,
  onPostRide,
  onViewEarnings,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>Michael</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statusIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Overview */}
        <Card style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Today's Earnings</Text>
            <TouchableOpacity onPress={onViewEarnings}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>${STATS.todayEarnings.toFixed(2)}</Text>
          <Text style={styles.earningsSub}>
            Weekly: ${STATS.weeklyEarnings.toFixed(2)}
          </Text>
          <View style={styles.earningsStatsRow}>
            <View style={styles.earningsStat}>
              <Ionicons name="car" size={18} color={Colors.accentLight} />
              <Text style={styles.earningsStatValue}>{STATS.totalTrips}</Text>
              <Text style={styles.earningsStatLabel}>Trips</Text>
            </View>
            <View style={styles.earningStatDivider} />
            <View style={styles.earningsStat}>
              <Ionicons name="star" size={18} color={Colors.star} />
              <Text style={styles.earningsStatValue}>{STATS.rating}</Text>
              <Text style={styles.earningsStatLabel}>Rating</Text>
            </View>
            <View style={styles.earningStatDivider} />
            <View style={styles.earningsStat}>
              <Ionicons name="time" size={18} color={Colors.accentLight} />
              <Text style={styles.earningsStatValue}>{STATS.onlineHours}h</Text>
              <Text style={styles.earningsStatLabel}>Online</Text>
            </View>
            <View style={styles.earningStatDivider} />
            <View style={styles.earningsStat}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accentLight} />
              <Text style={styles.earningsStatValue}>{STATS.acceptanceRate}%</Text>
              <Text style={styles.earningsStatLabel}>Acceptance</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={onPostRide}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#EBF4FF' }]}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Post Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={onViewRequests}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="list" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={onViewEarnings}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEFCBF' }]}>
              <Ionicons name="wallet" size={28} color="#B7791F" />
            </View>
            <Text style={styles.quickActionLabel}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FED7E2' }]}>
              <Ionicons name="settings" size={28} color="#C53030" />
            </View>
            <Text style={styles.quickActionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Open Requests Nearby */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open Requests Nearby</Text>
          <TouchableOpacity onPress={onViewRequests}>
            <Text style={styles.viewAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {OPEN_REQUESTS.map((req) => (
          <Card key={req.id} style={styles.requestCard} onPress={onViewRequests}>
            <View style={styles.requestRow}>
              <View style={styles.requestAvatar}>
                <Ionicons name="person" size={18} color={Colors.white} />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{req.passengerName}</Text>
                <Text style={styles.requestRoute}>{req.route}</Text>
                <View style={styles.requestMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.requestMetaText}>{req.time}</Text>
                  <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.requestMetaText}>{req.seats} seat{req.seats > 1 ? 's' : ''}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.bidButton}>
                <Text style={styles.bidButtonText}>Bid</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Upcoming Rides */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Rides</Text>
        </View>

        {UPCOMING_RIDES.map((ride) => (
          <Card key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideName}>{ride.passengerName}</Text>
              <Badge
                label={ride.status.toUpperCase()}
                backgroundColor={ride.status === 'confirmed' ? '#C6F6D5' : '#FEFCBF'}
                color={ride.status === 'confirmed' ? '#276749' : '#B7791F'}
              />
            </View>
            <View style={styles.rideRouteContainer}>
              <View style={styles.routeDots}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <View style={styles.routeLine} />
                <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeText}>{ride.pickup}</Text>
                <Text style={styles.routeText}>{ride.dropoff}</Text>
              </View>
            </View>
            <View style={styles.rideFooter}>
              <View style={styles.rideDetail}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.rideDetailText}>{ride.time}</Text>
              </View>
              <Text style={styles.ridePrice}>${ride.price.toFixed(2)}</Text>
            </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#C6F6D5',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#276749',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#276749',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsCard: {
    backgroundColor: Colors.primaryDark,
    marginBottom: Spacing.lg,
    borderColor: 'transparent',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  earningsTitle: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.accentLight,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
  },
  earningsSub: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  earningsStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  earningsStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  earningsStatValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  earningsStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    opacity: 0.6,
  },
  earningStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  requestCard: {
    marginBottom: Spacing.sm,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  requestName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  requestRoute: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  requestMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  bidButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  bidButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  rideCard: {
    marginBottom: Spacing.sm,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rideName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rideRouteContainer: {
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
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  ridePrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
});
