import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { StarRating } from '../../components/StarRating';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TrackRideScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const RIDE_DATA = {
  driver: 'Michael Chen',
  rating: 4.9,
  vehicle: 'Toyota Camry · Black',
  plate: 'ABC-1234',
  pickup: '123 Main Street',
  dropoff: '456 Oak Avenue',
  price: 25.0,
  status: 'On the way',
  eta: '12 min',
};

const TIMELINE_STEPS = [
  { label: 'Ride confirmed', time: '8:25 AM', done: true },
  { label: 'Driver en route', time: '8:26 AM', done: true },
  { label: 'Pickup', time: '8:30 AM', done: false, current: true },
  { label: 'Drop-off', time: '~8:48 AM', done: false },
];

export const TrackRideScreen: React.FC<TrackRideScreenProps> = ({ onBack, onComplete }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Ride</Text>
        <TouchableOpacity style={styles.sosButton}>
          <Ionicons name="warning" size={18} color={Colors.dangerDark} />
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={64} color={Colors.border} />
          <Text style={styles.mapText}>Live Map View</Text>
          <Text style={styles.mapSubtext}>Real-time tracking will appear here</Text>
        </View>

        <View style={styles.etaOverlay}>
          <Text style={styles.etaOverlayLabel}>ETA</Text>
          <Text style={styles.etaOverlayValue}>{RIDE_DATA.eta}</Text>
        </View>

        <View style={styles.timerOverlay}>
          <Ionicons name="time-outline" size={14} color={Colors.white} />
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <Badge
            label={RIDE_DATA.status.toUpperCase()}
            backgroundColor="#C6F6D5"
            color="#276749"
          />
          <Text style={styles.fareText}>${RIDE_DATA.price.toFixed(2)}</Text>
        </View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={24} color={Colors.white} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{RIDE_DATA.driver}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={RIDE_DATA.rating} size={12} />
              <Text style={styles.ratingText}>{RIDE_DATA.rating}</Text>
            </View>
            <Text style={styles.vehicleText}>{RIDE_DATA.vehicle}</Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionCircle}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle}>
              <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {TIMELINE_STEPS.map((step, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    step.done && styles.timelineDotDone,
                    step.current && styles.timelineDotCurrent,
                  ]}
                >
                  {step.done && (
                    <Ionicons name="checkmark" size={10} color={Colors.white} />
                  )}
                </View>
                {index < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      step.done && styles.timelineConnectorDone,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineLabel,
                    step.current && styles.timelineLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.timelineTime}>{step.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Share Trip"
            onPress={() => {}}
            variant="outline"
            size="sm"
            icon={<Ionicons name="share-outline" size={16} color={Colors.primary} />}
            style={styles.shareButton}
          />
          <Button
            title="Complete Ride"
            onPress={onComplete}
            variant="secondary"
            size="sm"
            style={styles.completeButton}
          />
        </View>
      </View>
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
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sosButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FED7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 240,
    backgroundColor: '#E8EDF2',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  mapSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  etaOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  etaOverlayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  etaOverlayValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  timerOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timerText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fareText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
  },
  ratingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  vehicleText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  driverActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeline: {
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  timelineDotCurrent: {
    borderColor: Colors.accent,
    borderWidth: 3,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
  },
  timelineConnectorDone: {
    backgroundColor: Colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  timelineLabelCurrent: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  shareButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});
