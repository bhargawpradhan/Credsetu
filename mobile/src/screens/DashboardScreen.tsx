import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api, getApiBaseUrl } from '../services/api';
import { CreateLoanPayload, Loan, LoanFilterStatus, LoanSummary } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { StatusFilterTabs } from '../components/StatusFilterTabs';
import { LoanCard } from '../components/LoanCard';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LoanFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Modals
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Load API base URL
  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

  // Fetch summary and loans
  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, loansRes] = await Promise.all([
        api.getSummary(),
        api.getLoans(selectedStatus, searchQuery),
      ]);

      if (summaryRes.success && summaryRes.summary) {
        setSummary(summaryRes.summary);
      }
      if (loansRes.success && loansRes.loans) {
        setLoans(loansRes.loans);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleMarkRepaid = async (loan: Loan) => {
    try {
      const res = await api.markLoanAsRepaid(loan.id);
      if (res.success) {
        // Refresh data to update summary and lists
        fetchData();
      } else {
        Alert.alert('Error', res.message || 'Could not mark loan as repaid.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed.');
    }
  };

  const handleDeleteLoan = (loan: Loan) => {
    const confirmDelete = async () => {
      try {
        const res = await api.deleteLoan(loan.id);
        if (res.success) {
          fetchData();
        } else {
          Alert.alert('Error', res.message || 'Failed to delete loan');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Delete failed');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete the loan for ${loan.friendName}?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Loan Entry',
        `Are you sure you want to delete the loan of ₹${loan.amount} for ${loan.friendName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleCreateLoan = async (payload: CreateLoanPayload) => {
    const res = await api.createLoan(payload);
    if (res.success) {
      fetchData();
      return { success: true };
    }
    return { success: false, message: res.message || 'Failed to create loan' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>MiniLedger</Text>
            <Text style={styles.headerSubtitle}>{user?.phone || 'My Ledger'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List with Sticky/Fixed top Summary Card */}
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
        ListHeaderComponent={
          <View>
            {/* Summary Card at the top */}
            <SummaryCard summary={summary} isLoading={isLoading} />

            {/* Status Filter Tabs */}
            <StatusFilterTabs
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              summary={summary}
            />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by friend name..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedStatus === 'all'
                  ? 'All Transactions'
                  : selectedStatus === 'active'
                  ? 'Active Loans'
                  : selectedStatus === 'overdue'
                  ? 'Overdue Loans'
                  : 'Repaid Loans'}
              </Text>
              <Text style={styles.sectionCount}>
                {loans.length} item{loans.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onMarkRepaid={handleMarkRepaid}
            onDelete={handleDeleteLoan}
            onViewReceipt={(url) => setPreviewReceiptUrl(url)}
            apiBaseUrl={apiBaseUrl}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.emptyText}>Loading loans...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={
                    selectedStatus === 'overdue'
                      ? 'happy-outline'
                      : selectedStatus === 'repaid'
                      ? 'wallet-outline'
                      : 'document-text-outline'
                  }
                  size={36}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedStatus === 'overdue'
                  ? 'No Overdue Loans!'
                  : selectedStatus === 'repaid'
                  ? 'No Repaid Loans Yet'
                  : 'No Loan Entries Found'}
              </Text>
              <Text style={styles.emptyText}>
                {selectedStatus === 'overdue'
                  ? 'All loans are on schedule or already settled.'
                  : 'Tap the button below to add your first loan entry.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button: Add Loan */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Loan</Text>
      </TouchableOpacity>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateLoan}
      />

      {/* Receipt Photo Modal */}
      <ReceiptModal
        visible={Boolean(previewReceiptUrl)}
        imageUrl={previewReceiptUrl}
        onClose={() => setPreviewReceiptUrl(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
