import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';
import { UserRole } from '../../types';

interface RoleSelectScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({ onSelectRole }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="car-sport" size={40} color={Colors.white} />
          </View>
          <Text style={styles.title}>How will you use RideShare?</Text>
          <Text style={styles.subtitle}>You can change this later in settings</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => onSelectRole('passenger')}
            activeOpacity={0.85}
          >
            <View style={[styles.roleIcon, { backgroundColor: '#EBF4FF' }]}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.roleName}>Passenger</Text>
            <Text style={styles.roleDescription}>
              Find rides, post requests, and travel comfortably with verified drivers
            </Text>
            <View style={styles.featuresColumn}>
              <FeatureItem icon="search" text="Find available rides" />
              <FeatureItem icon="megaphone" text="Post ride requests" />
              <FeatureItem icon="navigate" text="Track your ride live" />
            </View>
            <View style={styles.selectRow}>
              <Text style={styles.selectText}>Continue as Passenger</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => onSelectRole('driver')}
            activeOpacity={0.85}
          >
            <View style={[styles.roleIcon, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="car" size={40} color={Colors.accent} />
            </View>
            <Text style={styles.roleName}>Driver</Text>
            <Text style={styles.roleDescription}>
              Offer rides, bid on requests, and earn money on your schedule
            </Text>
            <View style={styles.featuresColumn}>
              <FeatureItem icon="cash" text="Earn on your terms" />
              <FeatureItem icon="list" text="Browse ride requests" />
              <FeatureItem icon="stats-chart" text="Track your earnings" />
            </View>
            <View style={[styles.selectRow, { borderColor: Colors.accent }]}>
              <Text style={[styles.selectText, { color: Colors.accent }]}>
                Continue as Driver
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.accent} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={featureStyles.row}>
    <Ionicons name={icon as any} size={16} color={Colors.textSecondary} />
    <Text style={featureStyles.text}>{text}</Text>
  </View>
);

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  cardsContainer: {
    gap: Spacing.md,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  roleName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  featuresColumn: {
    marginBottom: Spacing.md,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  selectText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
});
