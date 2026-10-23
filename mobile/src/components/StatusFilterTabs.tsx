import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LoanFilterStatus, LoanSummary } from '../types';
import { THEME } from '../theme/colors';

interface StatusFilterTabsProps {
  selectedStatus: LoanFilterStatus;
  onSelectStatus: (status: LoanFilterStatus) => void;
  summary: LoanSummary | null;
}

export const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({
  selectedStatus,
  onSelectStatus,
  summary,
}) => {
  const tabs: { key: LoanFilterStatus; label: string; count?: number; alert?: boolean }[] = [
    { key: 'all', label: 'All', count: summary?.counts.total },
    { key: 'active', label: 'Active', count: summary?.counts.active },
    {
      key: 'overdue',
      label: 'Overdue',
      count: summary?.counts.overdue,
      alert: (summary?.counts.overdue || 0) > 0,
    },
    { key: 'repaid', label: 'Repaid', count: summary?.counts.repaid },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tabs.map((tab) => {
          const isSelected = selectedStatus === tab.key;
          const isOverdueTab = tab.key === 'overdue' && (tab.count || 0) > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectStatus(tab.key)}
              style={[
                styles.tab,
                isSelected && styles.tabSelected,
                isOverdueTab && !isSelected && styles.overdueTabInactive,
                isOverdueTab && isSelected && styles.overdueTabSelected,
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                  isOverdueTab && !isSelected && styles.overdueTextInactive,
                ]}
              >
                {tab.label}
              </Text>

              {tab.count !== undefined && (
                <View
                  style={[
                    styles.badge,
                    isSelected ? styles.badgeSelected : styles.badgeInactive,
                    isOverdueTab && styles.badgeOverdue,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected ? styles.badgeTextSelected : styles.badgeTextInactive,
                      isOverdueTab && styles.badgeTextOverdue,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 11, 43, 0.45)', // Transparent frosted Deep Aubergine
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.15)',
    gap: 8,
  },
  tabSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: THEME.marigold.bright,
    shadowColor: THEME.marigold.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  overdueTabInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  overdueTabSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: THEME.overdue.bright,
    shadowColor: THEME.overdue.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.iceSilver.metallic,
    letterSpacing: 0.3,
  },
  tabTextSelected: {
    color: THEME.marigold.bright,
  },
  overdueTextInactive: {
    color: THEME.overdue.bright,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInactive: {
    backgroundColor: 'rgba(226, 232, 240, 0.12)',
  },
  badgeSelected: {
    backgroundColor: THEME.marigold.bright,
  },
  badgeOverdue: {
    backgroundColor: THEME.overdue.main,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextInactive: {
    color: THEME.iceSilver.muted,
  },
  badgeTextSelected: {
    color: THEME.aubergine.darkest,
  },
  badgeTextOverdue: {
    color: '#FFFFFF',
  },
});
