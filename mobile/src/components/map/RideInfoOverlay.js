import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance, formatDuration } from '../../utils/location';

export default function RideInfoOverlay({ distance, duration, status, estimatedArrival }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {distance != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        )}

        {duration != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        )}

        {estimatedArrival && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{estimatedArrival}</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
        )}
      </View>

      {status && (
        <View style={[styles.statusBadge, styles[`status_${status}`] || styles.status_default]}>
          <Text style={styles.statusText}>{formatStatus(status)}</Text>
        </View>
      )}
    </View>
  );
}

function formatStatus(status) {
  const labels = {
    waiting: 'Waiting for pickup',
    en_route_pickup: 'Driver en route to pickup',
    at_pickup: 'Driver at pickup',
    in_transit: 'Ride in progress',
    arriving: 'Arriving soon',
    completed: 'Ride completed',
  };
  return labels[status] || status.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  status_default: {
    backgroundColor: '#F3F4F6',
  },
  status_waiting: {
    backgroundColor: '#FEF3C7',
  },
  status_en_route_pickup: {
    backgroundColor: '#DBEAFE',
  },
  status_at_pickup: {
    backgroundColor: '#D1FAE5',
  },
  status_in_transit: {
    backgroundColor: '#EDE9FE',
  },
  status_arriving: {
    backgroundColor: '#FCE7F3',
  },
  status_completed: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
});
