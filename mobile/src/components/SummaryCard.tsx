import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanSummary } from '../types';
import { THEME } from '../theme/colors';
import { ThreeDTiltCard } from './ThreeDTiltCard';

interface SummaryCardProps {
  summary: LoanSummary | null;
  isLoading: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isLoading }) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const totalPending = summary?.totalPending ?? Math.max(0, totalLent - totalRepaid);

  return (
    <View style={styles.outerWrapper}>
      <ThreeDTiltCard
        maxTilt={10}
        glowColor={overdueAmount > 0 ? THEME.marigold.glowStrong : THEME.iceSilver.glow}
        style={styles.tiltCard}
      >
        {/* Holographic Specular Line at Top */}
        <View style={styles.specularLine} />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.marigoldPulseDot} />
              <Text style={styles.heroLabel}>Total Money Lent</Text>
            </View>
            <Text style={styles.heroAmount}>{formatCurrency(totalLent)}</Text>
          </View>

          {/* Pending Balance 3D Floating Chip */}
          <View style={styles.pendingChip}>
            <Text style={styles.pendingLabel}>Pending Balance</Text>
            <Text style={styles.pendingAmount}>{formatCurrency(totalPending)}</Text>
          </View>
        </View>

        {/* 3D Glass Stat Pods */}
        <View style={styles.gridContainer}>
          {/* Total Repaid Pod */}
          <View style={[styles.statPod, styles.repaidPod]}>
            <View style={styles.podHeader}>
              <View style={styles.repaidIconGlow}>
                <Ionicons name="checkmark-done" size={14} color={THEME.repaid.light} />
              </View>
              <Text style={styles.podLabel}>Total Repaid</Text>
            </View>
            <Text style={styles.repaidValue}>{formatCurrency(totalRepaid)}</Text>
            <Text style={styles.podSubText}>
              {summary?.counts.repaid || 0} loan{summary?.counts.repaid === 1 ? '' : 's'} settled
            </Text>
          </View>

          {/* Overdue Amount Pod - VIVID 3D MARIGOLD & CRIMSON */}
          <View
            style={[
              styles.statPod,
              styles.overduePod,
              overdueAmount > 0 && styles.overdueActivePod,
            ]}
          >
            <View style={styles.podHeader}>
              <View
                style={[
                  styles.overdueIconGlow,
                  overdueAmount > 0 && styles.overdueIconGlowActive,
                ]}
              >
                <Ionicons
                  name={overdueAmount > 0 ? 'flame' : 'shield-checkmark-outline'}
                  size={14}
                  color={overdueAmount > 0 ? THEME.marigold.bright : THEME.iceSilver.muted}
                />
              </View>
              <Text
                style={[
                  styles.podLabel,
                  overdueAmount > 0 && { color: THEME.marigold.light, fontWeight: '800' },
                ]}
              >
                Overdue Amount
              </Text>
            </View>
            <Text
              style={[
                styles.overdueValue,
                overdueAmount > 0 && styles.overdueValueActive,
              ]}
            >
              {formatCurrency(overdueAmount)}
            </Text>
            <Text
              style={[
                styles.podSubText,
                overdueAmount > 0 && { color: THEME.marigold.bright, fontWeight: '700' },
              ]}
            >
              {summary?.counts.overdue || 0} overdue loan{summary?.counts.overdue === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </ThreeDTiltCard>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
  },
  tiltCard: {
    padding: 20,
    backgroundColor: 'rgba(30, 11, 43, 0.45)', // Completely transparent Deep Aubergine
    borderColor: 'rgba(226, 232, 240, 0.22)',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1.5,
    backgroundColor: 'rgba(226, 232, 240, 0.65)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.12)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  marigoldPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.marigold.bright,
    shadowColor: THEME.marigold.bright,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.iceSilver.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.8,
    marginTop: 2,
    textShadowColor: 'rgba(245, 158, 11, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  pendingChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'flex-end',
  },
  pendingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.marigold.light,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pendingAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.marigold.bright,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statPod: {
    flex: 1,
    backgroundColor: 'rgba(19, 6, 28, 0.55)', // Translucent glass pod
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.12)',
  },
  repaidPod: {
    borderLeftWidth: 3.5,
    borderLeftColor: THEME.repaid.main,
  },
  overduePod: {
    borderLeftWidth: 3.5,
    borderLeftColor: THEME.iceSilver.muted,
  },
  overdueActivePod: {
    borderLeftColor: THEME.marigold.bright,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(48, 14, 25, 0.55)',
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  repaidIconGlow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueIconGlow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueIconGlowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  podLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.iceSilver.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  repaidValue: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.repaid.light,
  },
  overdueValue: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.iceSilver.metallic,
  },
  overdueValueActive: {
    color: THEME.marigold.bright,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  podSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.iceSilver.dark,
    marginTop: 4,
  },
});
