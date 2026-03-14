import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function getScoreColor(score) {
  if (score >= 4.5) return '#059669';
  if (score >= 4.0) return '#10B981';
  if (score >= 3.5) return '#D97706';
  if (score >= 3.0) return '#F59E0B';
  if (score >= 2.0) return '#EF4444';
  return '#DC2626';
}

function getScoreLabel(score) {
  if (score >= 4.5) return 'Excellent';
  if (score >= 4.0) return 'Very Good';
  if (score >= 3.5) return 'Good';
  if (score >= 3.0) return 'Fair';
  if (score >= 2.0) return 'Poor';
  return 'Very Poor';
}

export default function TrustScoreCard({ score, totalRatings, compact = false }) {
  const numericScore = parseFloat(score) || 0;
  const color = getScoreColor(numericScore);
  const label = getScoreLabel(numericScore);
  const fillPercent = (numericScore / 5) * 100;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.compactScore, { color }]}>{numericScore.toFixed(1)}</Text>
        </View>
        <Text style={styles.compactLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trust Score</Text>
          <Text style={styles.subtitle}>{totalRatings || 0} ratings</Text>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color }]}>{numericScore.toFixed(2)}</Text>
          <Text style={styles.scoreMax}>/5</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  barContainer: {
    gap: 6,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  compactLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
