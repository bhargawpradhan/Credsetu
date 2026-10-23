import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loan } from '../types';

interface LoanCardProps {
  loan: Loan;
  onMarkRepaid: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
  onViewReceipt: (url: string) => void;
  apiBaseUrl: string;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onMarkRepaid,
  onDelete,
  onViewReceipt,
  apiBaseUrl,
}) => {
  // Format amount
  const formattedAmount = `₹${loan.amount.toLocaleString('en-IN')}`;

  // Calculate days difference
  const calculateDaysText = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = loan.dueDate.split('-').map(Number);
    const dueDateObj = new Date(year, month - 1, day);
    dueDateObj.setHours(0, 0, 0, 0);

    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (loan.isRepaid) {
      if (loan.repaidAt) {
        const repaidDate = new Date(loan.repaidAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });
        return `Repaid on ${repaidDate}`;
      }
      return 'Repaid';
    }

    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays);
      return `Overdue by ${pastDays} day${pastDays === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const receiptFullUrl = loan.receiptUrl
    ? loan.receiptUrl.startsWith('http')
      ? loan.receiptUrl
      : `${apiBaseUrl}${loan.receiptUrl}`
    : null;

  return (
    <View
      style={[
        styles.card,
        loan.isOverdue && styles.overdueCard,
        loan.isRepaid && styles.repaidCard,
      ]}
    >
      {/* Overdue Alert Banner if overdue */}
      {loan.isOverdue && (
        <View style={styles.overdueBanner}>
          <Ionicons name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.overdueBannerText}>PAYMENT OVERDUE</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Left Avatar & Friend info */}
        <View style={styles.leftColumn}>
          <View
            style={[
              styles.avatar,
              loan.isOverdue && styles.avatarOverdue,
              loan.isRepaid && styles.avatarRepaid,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                loan.isOverdue && styles.avatarTextOverdue,
                loan.isRepaid && styles.avatarTextRepaid,
              ]}
            >
              {getInitials(loan.friendName)}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.friendName} numberOfLines={1}>
              {loan.friendName}
            </Text>

            <View style={styles.dueDateRow}>
              <Ionicons
                name={loan.isRepaid ? 'checkmark-circle' : loan.isOverdue ? 'warning' : 'calendar-outline'}
                size={13}
                color={loan.isRepaid ? '#16A34A' : loan.isOverdue ? '#DC2626' : '#64748B'}
              />
              <Text
                style={[
                  styles.dueText,
                  loan.isOverdue && styles.dueTextOverdue,
                  loan.isRepaid && styles.dueTextRepaid,
                ]}
              >
                {calculateDaysText()}
              </Text>
            </View>

            {loan.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                "{loan.notes}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Column: Amount & Receipt Preview */}
        <View style={styles.rightColumn}>
          <Text
            style={[
              styles.amountText,
              loan.isOverdue && styles.amountTextOverdue,
              loan.isRepaid && styles.amountTextRepaid,
            ]}
          >
            {formattedAmount}
          </Text>

          {receiptFullUrl && (
            <TouchableOpacity
              onPress={() => onViewReceipt(receiptFullUrl)}
              style={styles.receiptButton}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={12} color="#0284C7" />
              <Text style={styles.receiptButtonText}>Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Text style={styles.dateLabel}>Due: {loan.dueDate}</Text>

        <View style={styles.actionButtons}>
          {!loan.isRepaid && (
            <TouchableOpacity
              style={styles.repayButton}
              onPress={() => onMarkRepaid(loan)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.repayButtonText}>Mark Repaid</Text>
            </TouchableOpacity>
          )}

          {loan.isRepaid && (
            <View style={styles.settledBadge}>
              <Ionicons name="checkmark-done" size={14} color="#16A34A" />
              <Text style={styles.settledBadgeText}>Settled</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(loan)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  overdueCard: {
    borderColor: '#F87171',
    borderWidth: 1.5,
    backgroundColor: '#FFFBFB',
    shadowColor: '#DC2626',
    shadowOpacity: 0.08,
  },
  repaidCard: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  overdueBanner: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  overdueBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverdue: {
    backgroundColor: '#FEE2E2',
  },
  avatarRepaid: {
    backgroundColor: '#E2E8F0',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  avatarTextOverdue: {
    color: '#DC2626',
  },
  avatarTextRepaid: {
    color: '#64748B',
  },
  infoContainer: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dueTextOverdue: {
    color: '#DC2626',
    fontWeight: '700',
  },
  dueTextRepaid: {
    color: '#16A34A',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 3,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  amountTextOverdue: {
    color: '#DC2626',
  },
  amountTextRepaid: {
    color: '#64748B',
    textDecorationLine: 'none',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  receiptButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  dateLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  repayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  deleteButton: {
    padding: 6,
  },
});
