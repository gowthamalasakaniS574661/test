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
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

interface EarningsScreenProps {
  onBack: () => void;
}

type TimePeriod = 'today' | 'week' | 'month' | 'all';

const EARNINGS_DATA = {
  today: { total: 142.5, trips: 6, hours: 6.5, avgPerTrip: 23.75 },
  week: { total: 856.0, trips: 34, hours: 38, avgPerTrip: 25.18 },
  month: { total: 3420.0, trips: 142, hours: 155, avgPerTrip: 24.08 },
  all: { total: 28650.0, trips: 1205, hours: 1340, avgPerTrip: 23.78 },
};

const RECENT_EARNINGS = [
  { id: '1', route: 'Main St → Downtown', date: 'Today, 3:45 PM', amount: 28.5, status: 'completed' as const },
  { id: '2', route: 'Airport → City Center', date: 'Today, 1:20 PM', amount: 45.0, status: 'completed' as const },
  { id: '3', route: 'Mall → University', date: 'Today, 11:00 AM', amount: 18.0, status: 'completed' as const },
  { id: '4', route: 'Hotel → Convention', date: 'Today, 9:15 AM', amount: 22.0, status: 'completed' as const },
  { id: '5', route: 'Train Station → Tech Park', date: 'Today, 7:30 AM', amount: 15.0, status: 'completed' as const },
  { id: '6', route: 'Suburb → Downtown', date: 'Today, 6:00 AM', amount: 14.0, status: 'completed' as const },
  { id: '7', route: 'Home → Office', date: 'Yesterday, 5:30 PM', amount: 20.0, status: 'completed' as const },
  { id: '8', route: 'Park → Mall', date: 'Yesterday, 3:00 PM', amount: 12.5, status: 'pending' as const },
];

const WEEKLY_CHART_DATA = [
  { day: 'Mon', amount: 120 },
  { day: 'Tue', amount: 95 },
  { day: 'Wed', amount: 140 },
  { day: 'Thu', amount: 110 },
  { day: 'Fri', amount: 165 },
  { day: 'Sat', amount: 85 },
  { day: 'Sun', amount: 142 },
];

export const EarningsScreen: React.FC<EarningsScreenProps> = ({ onBack }) => {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const currentData = EARNINGS_DATA[period];
  const maxChart = Math.max(...WEEKLY_CHART_DATA.map((d) => d.amount));

  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity>
          <Ionicons name="download-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodTab, period === p.key && styles.periodTabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Earnings Card */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>${currentData.total.toFixed(2)}</Text>
          <View style={styles.totalStatsRow}>
            <View style={styles.totalStat}>
              <Ionicons name="car" size={18} color={Colors.accentLight} />
              <Text style={styles.totalStatValue}>{currentData.trips}</Text>
              <Text style={styles.totalStatLabel}>Trips</Text>
            </View>
            <View style={styles.totalStatDivider} />
            <View style={styles.totalStat}>
              <Ionicons name="time" size={18} color={Colors.accentLight} />
              <Text style={styles.totalStatValue}>{currentData.hours}h</Text>
              <Text style={styles.totalStatLabel}>Online</Text>
            </View>
            <View style={styles.totalStatDivider} />
            <View style={styles.totalStat}>
              <Ionicons name="trending-up" size={18} color={Colors.accentLight} />
              <Text style={styles.totalStatValue}>${currentData.avgPerTrip.toFixed(2)}</Text>
              <Text style={styles.totalStatLabel}>Avg/Trip</Text>
            </View>
          </View>
        </Card>

        {/* Weekly Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Overview</Text>
          <View style={styles.chartContainer}>
            {WEEKLY_CHART_DATA.map((item) => {
              const height = (item.amount / maxChart) * 120;
              const isToday = item.day === 'Sun';
              return (
                <View key={item.day} style={styles.chartBar}>
                  <Text style={styles.chartBarAmount}>${item.amount}</Text>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height,
                        backgroundColor: isToday ? Colors.accent : Colors.primaryLight,
                      },
                    ]}
                  />
                  <Text
                    style={[styles.chartBarLabel, isToday && styles.chartBarLabelActive]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <Card style={styles.quickStatCard}>
            <Ionicons name="cash" size={24} color={Colors.success} />
            <Text style={styles.quickStatValue}>${(currentData.total * 0.85).toFixed(0)}</Text>
            <Text style={styles.quickStatLabel}>Net Earnings</Text>
          </Card>
          <Card style={styles.quickStatCard}>
            <Ionicons name="trending-up" size={24} color={Colors.accent} />
            <Text style={styles.quickStatValue}>+12%</Text>
            <Text style={styles.quickStatLabel}>vs Last Week</Text>
          </Card>
        </View>

        {/* Transaction History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {RECENT_EARNINGS.map((earning) => (
          <Card key={earning.id} style={styles.earningItem}>
            <View style={styles.earningRow}>
              <View style={styles.earningIcon}>
                <Ionicons name="car" size={18} color={Colors.primary} />
              </View>
              <View style={styles.earningInfo}>
                <Text style={styles.earningRoute}>{earning.route}</Text>
                <Text style={styles.earningDate}>{earning.date}</Text>
              </View>
              <View style={styles.earningRight}>
                <Text style={styles.earningAmount}>+${earning.amount.toFixed(2)}</Text>
                <Badge
                  label={earning.status === 'completed' ? 'PAID' : 'PENDING'}
                  backgroundColor={earning.status === 'completed' ? '#C6F6D5' : '#FEFCBF'}
                  color={earning.status === 'completed' ? '#276749' : '#B7791F'}
                />
              </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: Colors.primary,
  },
  periodTabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTabTextActive: {
    color: Colors.white,
  },
  totalCard: {
    backgroundColor: Colors.primaryDark,
    marginBottom: Spacing.md,
    borderColor: 'transparent',
  },
  totalLabel: {
    fontSize: FontSize.md,
    color: Colors.textInverse,
    opacity: 0.7,
  },
  totalAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.white,
    marginVertical: Spacing.xs,
  },
  totalStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  totalStatValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  totalStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    opacity: 0.6,
  },
  totalStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  chartCard: {
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: Spacing.lg,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarAmount: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  chartBarFill: {
    width: 24,
    borderRadius: 6,
    minHeight: 8,
  },
  chartBarLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  chartBarLabelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  quickStatValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  earningItem: {
    marginBottom: Spacing.sm,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  earningRoute: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  earningDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  earningRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  earningAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.success,
  },
});
