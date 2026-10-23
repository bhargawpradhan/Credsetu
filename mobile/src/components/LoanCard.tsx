import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loan } from '../types';
import { THEME } from '../theme/colors';
import { ThreeDTiltCard } from './ThreeDTiltCard';

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
  const formattedAmount = `₹${loan.amount.toLocaleString('en-IN')}`;

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
    <View style={styles.cardWrapper}>
      <ThreeDTiltCard
        isOverdue={loan.isOverdue}
        isRepaid={loan.isRepaid}
        maxTilt={8}
      >
        {/* Overdue 3D Fiery Banner */}
        {loan.isOverdue && (
          <View style={styles.overdueBanner}>
            <Ionicons name="flame" size={14} color={THEME.marigold.bright} />
            <Text style={styles.overdueBannerText}>CRITICAL • PAYMENT OVERDUE</Text>
            <View style={styles.alertPulse} />
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
                  name={
                    loan.isRepaid
                      ? 'checkmark-circle'
                      : loan.isOverdue
                      ? 'alert-circle'
                      : 'time-outline'
                  }
                  size={13}
                  color={
                    loan.isRepaid
                      ? THEME.repaid.light
                      : loan.isOverdue
                      ? THEME.marigold.bright
                      : THEME.iceSilver.muted
                  }
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
                <Ionicons name="receipt-outline" size={12} color={THEME.marigold.bright} />
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
                activeOpacity={0.75}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.repayButtonText}>Mark Repaid</Text>
              </TouchableOpacity>
            )}

            {loan.isRepaid && (
              <View style={styles.settledBadge}>
                <Ionicons name="checkmark-done" size={14} color={THEME.repaid.light} />
                <Text style={styles.settledBadgeText}>Settled</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(loan)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={THEME.iceSilver.dark} />
            </TouchableOpacity>
          </View>
        </View>
      </ThreeDTiltCard>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  overdueBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  overdueBannerText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.marigold.bright,
    letterSpacing: 0.8,
  },
  alertPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.marigold.bright,
    marginLeft: 'auto',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)', // Marigold glass avatar
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: THEME.marigold.bright,
  },
  avatarRepaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.marigold.bright,
  },
  avatarTextOverdue: {
    color: THEME.marigold.bright,
  },
  avatarTextRepaid: {
    color: THEME.repaid.light,
  },
  infoContainer: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.2,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    color: THEME.iceSilver.muted,
    fontWeight: '600',
  },
  dueTextOverdue: {
    color: THEME.marigold.bright,
    fontWeight: '800',
  },
  dueTextRepaid: {
    color: THEME.repaid.light,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: THEME.iceSilver.dark,
    fontStyle: 'italic',
    marginTop: 3,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.5,
  },
  amountTextOverdue: {
    color: THEME.marigold.bright,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  amountTextRepaid: {
    color: THEME.iceSilver.muted,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    marginTop: 6,
  },
  receiptButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.marigold.bright,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.08)',
    backgroundColor: 'rgba(10, 3, 16, 0.35)',
  },
  dateLabel: {
    fontSize: 11,
    color: THEME.iceSilver.dark,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 10,
    shadowColor: THEME.repaid.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  repayButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.repaid.light,
  },
  deleteButton: {
    padding: 6,
  },
});
