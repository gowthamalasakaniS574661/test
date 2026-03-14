import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { TrustScoreCard, TrustScoreBreakdown } from '../../components/trust';
import { trustScoreAPI } from '../../api/trustScore';

export default function TrustScoreScreen({ route }) {
  const userId = route?.params?.userId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const isOwnScore = !userId;

  const load = useCallback(async () => {
    try {
      const response = isOwnScore
        ? await trustScoreAPI.getMyTrustScore()
        : await trustScoreAPI.getUserTrustScore(userId);
      setData(response.data);
    } catch (err) {
      console.error('Failed to load trust score:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, isOwnScore]);

  useEffect(() => { load(); }, [load]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const response = await trustScoreAPI.recalculate();
      setData((prev) => ({
        ...prev,
        currentScore: response.data.newScore,
        breakdown: response.data.breakdown,
      }));
      Alert.alert('Updated', `Your trust score is now ${response.data.newScore}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to recalculate trust score');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load trust score.</Text>
      </View>
    );
  }

  const breakdown = data.breakdown;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor="#4F46E5"
        />
      }
    >
      {data.name && <Text style={styles.userName}>{data.name}</Text>}

      <TrustScoreCard
        score={data.currentScore || breakdown?.overallScore}
        totalRatings={data.totalRatings}
      />

      <View style={styles.algorithmCard}>
        <Text style={styles.algorithmTitle}>How Your Score is Calculated</Text>
        <Text style={styles.algorithmText}>
          Your trust score is a weighted combination of multiple factors based on your role.
          New users start near 3.0 and the score becomes more data-driven as you complete
          more rides and receive ratings.
        </Text>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>
        <TrustScoreBreakdown breakdown={breakdown} />
      </View>

      {data.lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </Text>
      )}

      {isOwnScore && (
        <TouchableOpacity
          style={styles.recalcButton}
          onPress={handleRecalculate}
          disabled={recalculating}
        >
          {recalculating ? (
            <ActivityIndicator color="#4F46E5" size="small" />
          ) : (
            <Text style={styles.recalcButtonText}>Recalculate Score</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  errorText: { fontSize: 16, color: '#6B7280' },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  algorithmCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  algorithmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 8,
  },
  algorithmText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 20,
    opacity: 0.85,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  recalcButton: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recalcButtonText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
});
