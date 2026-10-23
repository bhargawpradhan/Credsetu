import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LoanFilterStatus, LoanSummary } from '../types';

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
              activeOpacity={0.7}
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
    marginBottom: 12,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabSelected: {
    backgroundColor: '#0F172A',
  },
  overdueTabInactive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueTabSelected: {
    backgroundColor: '#DC2626',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  overdueTextInactive: {
    color: '#DC2626',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeOverdue: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextInactive: {
    color: '#475569',
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
  badgeTextOverdue: {
    color: '#FFFFFF',
  },
});
