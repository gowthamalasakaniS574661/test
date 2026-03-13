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
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface PassengerHomeScreenProps {
  onPostRequest: () => void;
  onViewBids: (requestId: string) => void;
  onTrackRide: (rideId: string) => void;
}

const ACTIVE_RIDE = {
  id: 'ride-1',
  driver: 'Michael Chen',
  vehicle: 'Toyota Camry · Black',
  plate: 'ABC-1234',
  eta: '3 min',
  pickup: '123 Main Street',
  dropoff: '456 Oak Avenue',
};

const RECENT_REQUESTS = [
  {
    id: 'req-1',
    pickup: 'Home',
    dropoff: 'Downtown Office',
    time: 'Today, 8:30 AM',
    status: 'bidding' as const,
    bidCount: 4,
  },
  {
    id: 'req-2',
    pickup: 'Mall',
    dropoff: 'Airport Terminal 2',
    time: 'Tomorrow, 2:00 PM',
    status: 'open' as const,
    bidCount: 0,
  },
];

export const PassengerHomeScreen: React.FC<PassengerHomeScreenProps> = ({
  onPostRequest,
  onViewBids,
  onTrackRide,
}) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    open: { bg: '#EBF4FF', text: Colors.primaryLight },
    bidding: { bg: '#FEFCBF', text: '#B7791F' },
    accepted: { bg: '#C6F6D5', text: '#276749' },
    in_progress: { bg: '#E9D8FD', text: '#553C9A' },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>Sarah</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={onPostRequest}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#EBF4FF' }]}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Post Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="time" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEFCBF' }]}>
              <Ionicons name="star" size={28} color="#B7791F" />
            </View>
            <Text style={styles.quickActionLabel}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FED7E2' }]}>
              <Ionicons name="help-circle" size={28} color="#C53030" />
            </View>
            <Text style={styles.quickActionLabel}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Active Ride */}
        <Card style={styles.activeRideCard}>
          <View style={styles.activeRideHeader}>
            <Text style={styles.sectionTitle}>Active Ride</Text>
            <Badge label="In Progress" backgroundColor="#E9D8FD" color="#553C9A" />
          </View>
          <View style={styles.activeRideBody}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={Colors.white} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ACTIVE_RIDE.driver}</Text>
                <Text style={styles.vehicleInfo}>{ACTIVE_RIDE.vehicle}</Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>ETA {ACTIVE_RIDE.eta}</Text>
              </View>
            </View>
            <View style={styles.routeContainer}>
              <View style={styles.routeDots}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <View style={styles.routeLine} />
                <View style={[styles.dot, { backgroundColor: Colors.dangerDark }]} />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeText}>{ACTIVE_RIDE.pickup}</Text>
                <Text style={styles.routeText}>{ACTIVE_RIDE.dropoff}</Text>
              </View>
            </View>
          </View>
          <Button
            title="Track Ride"
            onPress={() => onTrackRide(ACTIVE_RIDE.id)}
            variant="secondary"
            size="sm"
            icon={<Ionicons name="navigate" size={16} color={Colors.white} />}
          />
        </Card>

        {/* Recent Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {RECENT_REQUESTS.map((request) => {
          const sc = statusColors[request.status] ?? statusColors.open;
          return (
            <Card
              key={request.id}
              style={styles.requestCard}
              onPress={() => onViewBids(request.id)}
            >
              <View style={styles.requestRow}>
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
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
              <View style={styles.requestFooter}>
                <Badge
                  label={request.status.replace('_', ' ').toUpperCase()}
                  backgroundColor={sc.bg}
                  color={sc.text}
                />
                <Text style={styles.requestTime}>{request.time}</Text>
                {request.bidCount > 0 && (
                  <View style={styles.bidCountRow}>
                    <Ionicons name="pricetag" size={14} color={Colors.accent} />
                    <Text style={styles.bidCountText}>{request.bidCount} bids</Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}

        <Button
          title="Post New Ride Request"
          onPress={onPostRequest}
          size="lg"
          style={styles.ctaButton}
          icon={<Ionicons name="add" size={20} color={Colors.white} />}
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dangerDark,
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
  activeRideCard: {
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  activeRideHeader: {
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
  activeRideBody: {
    marginBottom: Spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  vehicleInfo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  etaBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  etaText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  routeContainer: {
    flexDirection: 'row',
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  requestCard: {
    marginBottom: Spacing.sm,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requestTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bidCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  bidCountText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: Spacing.lg,
  },
});
