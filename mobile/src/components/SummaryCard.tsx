import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanSummary } from '../types';

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
  const totalPending = summary?.totalPending ?? (totalLent - totalRepaid);

  return (
    <View style={styles.container}>
      {/* Top Banner: Total Lent & Outstanding */}
      <View style={styles.heroSection}>
        <View>
          <Text style={styles.heroSubtitle}>Total Money Lent</Text>
          <Text style={styles.heroAmount}>{formatCurrency(totalLent)}</Text>
        </View>
        <View style={styles.outstandingBadge}>
          <Text style={styles.outstandingLabel}>Pending Balance</Text>
          <Text style={styles.outstandingAmount}>{formatCurrency(totalPending)}</Text>
        </View>
      </View>

      {/* Grid of Stats */}
      <View style={styles.gridContainer}>
        {/* Total Repaid Card */}
        <View style={[styles.statCard, styles.repaidCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-done" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.statLabel}>Total Repaid</Text>
          </View>
          <Text style={[styles.statValue, { color: '#2E7D32' }]}>
            {formatCurrency(totalRepaid)}
          </Text>
          <Text style={styles.statSubText}>
            {summary?.counts.repaid || 0} loan{summary?.counts.repaid === 1 ? '' : 's'} settled
          </Text>
        </View>

        {/* Overdue Amount Card - PROMINENT HIGHLIGHT */}
        <View
          style={[
            styles.statCard,
            styles.overdueCard,
            overdueAmount > 0 ? styles.overdueActiveBorder : null,
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: overdueAmount > 0 ? '#FFEBEE' : '#F5F5F5' },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color={overdueAmount > 0 ? '#D32F2F' : '#757575'}
              />
            </View>
            <Text style={[styles.statLabel, overdueAmount > 0 ? { color: '#B71C1C' } : null]}>
              Overdue Amount
            </Text>
          </View>
          <Text
            style={[
              styles.statValue,
              { color: overdueAmount > 0 ? '#D32F2F' : '#616161' },
            ]}
          >
            {formatCurrency(overdueAmount)}
          </Text>
          <Text style={[styles.statSubText, overdueAmount > 0 ? { color: '#C62828' } : null]}>
            {summary?.counts.overdue || 0} overdue loan{summary?.counts.overdue === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B', // Rich dark navy
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  outstandingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  outstandingLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  outstandingAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38BDF8', // Light blue accent
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
  },
  repaidCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  overdueActiveBorder: {
    borderLeftColor: '#D32F2F',
    backgroundColor: '#FFF5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
});
