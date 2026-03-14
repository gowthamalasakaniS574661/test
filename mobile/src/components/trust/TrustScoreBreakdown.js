import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function FactorBar({ label, score, weight, detail, icon }) {
  const fillPercent = (score / 5) * 100;
  const weightPercent = Math.round(weight * 100);

  return (
    <View style={styles.factorContainer}>
      <View style={styles.factorHeader}>
        <Text style={styles.factorIcon}>{icon}</Text>
        <View style={styles.factorInfo}>
          <Text style={styles.factorLabel}>{label}</Text>
          <Text style={styles.factorDetail}>{detail}</Text>
        </View>
        <View style={styles.factorScoreContainer}>
          <Text style={styles.factorScore}>{score.toFixed(1)}</Text>
          <Text style={styles.factorWeight}>{weightPercent}%</Text>
        </View>
      </View>
      <View style={styles.factorBar}>
        <View style={[styles.factorBarFill, { width: `${fillPercent}%` }]} />
      </View>
    </View>
  );
}

export default function TrustScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;

  const { role, driver, passenger } = breakdown;

  return (
    <View style={styles.container}>
      {driver && (role === 'driver' || role === 'both') && (
        <View style={styles.section}>
          {role === 'both' && <Text style={styles.sectionTitle}>Driver Score</Text>}
          <FactorBar
            icon="✅"
            label="Completed Rides"
            score={driver.factors.completedRides.score}
            weight={driver.factors.completedRides.weight}
            detail={
              driver.factors.completedRides.total > 0
                ? `${driver.factors.completedRides.completed}/${driver.factors.completedRides.total} rides (${driver.factors.completedRides.rate}%)`
                : 'No rides yet'
            }
          />
          <FactorBar
            icon="⭐"
            label="Rating Average"
            score={driver.factors.ratingAverage.score}
            weight={driver.factors.ratingAverage.weight}
            detail={
              driver.factors.ratingAverage.average
                ? `${driver.factors.ratingAverage.average.toFixed(1)} avg (${driver.factors.ratingAverage.count} reviews)`
                : 'No ratings yet'
            }
          />
          <FactorBar
            icon="🚫"
            label="Cancellations"
            score={driver.factors.cancellations.score}
            weight={driver.factors.cancellations.weight}
            detail={
              driver.factors.cancellations.total > 0
                ? `${driver.factors.cancellations.cancelled} cancelled (${driver.factors.cancellations.rate}% rate)`
                : 'No cancellations'
            }
          />
          <FactorBar
            icon="⚡"
            label="Response Time"
            score={driver.factors.responseTime.score}
            weight={driver.factors.responseTime.weight}
            detail={
              driver.factors.responseTime.avgMinutes
                ? `${driver.factors.responseTime.avgMinutes} min avg (${driver.factors.responseTime.count} responses)`
                : 'No data yet'
            }
          />
        </View>
      )}

      {passenger && (role === 'passenger' || role === 'both') && (
        <View style={styles.section}>
          {role === 'both' && <Text style={styles.sectionTitle}>Passenger Score</Text>}
          <FactorBar
            icon="🎯"
            label="Ride Completion"
            score={passenger.factors.rideCompletion.score}
            weight={passenger.factors.rideCompletion.weight}
            detail={
              passenger.factors.rideCompletion.total > 0
                ? `${passenger.factors.rideCompletion.completed}/${passenger.factors.rideCompletion.total} rides (${passenger.factors.rideCompletion.rate}%)`
                : 'No bookings yet'
            }
          />
          <FactorBar
            icon="💳"
            label="Payment Success"
            score={passenger.factors.paymentSuccess.score}
            weight={passenger.factors.paymentSuccess.weight}
            detail={
              passenger.factors.paymentSuccess.total > 0
                ? `${passenger.factors.paymentSuccess.successful} successful, ${passenger.factors.paymentSuccess.failed} failed`
                : 'No payments yet'
            }
          />
          <FactorBar
            icon="⭐"
            label="Ratings"
            score={passenger.factors.ratings.score}
            weight={passenger.factors.ratings.weight}
            detail={
              passenger.factors.ratings.average
                ? `${passenger.factors.ratings.average.toFixed(1)} avg (${passenger.factors.ratings.count} reviews)`
                : 'No ratings yet'
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  factorContainer: {
    gap: 6,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  factorIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  factorInfo: {
    flex: 1,
  },
  factorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  factorDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  factorScoreContainer: {
    alignItems: 'flex-end',
  },
  factorScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  factorWeight: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  factorBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 34,
  },
  factorBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
});
