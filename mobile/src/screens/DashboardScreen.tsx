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
import { THEME } from '../theme/colors';
import { ThreeDBackground } from '../components/ThreeDBackground';
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

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl);
  }, []);

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
    <ThreeDBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* 3D Glass Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <Ionicons name="wallet-outline" size={20} color={THEME.marigold.bright} />
            </View>
            <View>
              <Text style={styles.headerTitle}>MiniLedger</Text>
              <Text style={styles.headerSubtitle}>{user?.phone || 'My Ledger'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.75}>
              <Ionicons name="refresh" size={18} color={THEME.iceSilver.main} />
            </TouchableOpacity>

            <TouchableOpacity onPress={logout} style={styles.iconBtn} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={18} color={THEME.marigold.bright} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main List */}
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={THEME.marigold.bright}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Summary Card */}
              <SummaryCard summary={summary} isLoading={isLoading} />

              {/* Status Filter Tabs */}
              <StatusFilterTabs
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                summary={summary}
              />

              {/* Search Bar in 3D Glass */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color={THEME.marigold.bright} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by friend name..."
                  placeholderTextColor={THEME.iceSilver.dark}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={THEME.iceSilver.muted} />
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
                <ActivityIndicator size="large" color={THEME.marigold.bright} />
                <Text style={styles.emptyText}>Loading ledger transactions...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name={
                      selectedStatus === 'overdue'
                        ? 'checkmark-done-circle-outline'
                        : selectedStatus === 'repaid'
                        ? 'wallet-outline'
                        : 'document-text-outline'
                    }
                    size={38}
                    color={THEME.marigold.bright}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedStatus === 'overdue'
                    ? 'No Overdue Loans!'
                    : selectedStatus === 'repaid'
                    ? 'No Settled Loans Yet'
                    : 'No Transactions Found'}
                </Text>
                <Text style={styles.emptyText}>
                  {selectedStatus === 'overdue'
                    ? 'All loans are on schedule or already fully repaid.'
                    : 'Tap the 3D button below to track your first loan entry.'}
                </Text>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
        />

        {/* 3D Floating Action Button: Add Loan */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={THEME.aubergine.darkest} />
          <Text style={styles.fabText}>Add Loan</Text>
        </TouchableOpacity>

        {/* Add Loan Modal */}
        <AddLoanModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          onSubmit={handleCreateLoan}
        />

        {/* Receipt Modal */}
        <ReceiptModal
          visible={Boolean(previewReceiptUrl)}
          imageUrl={previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
        />
      </SafeAreaView>
    </ThreeDBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    backgroundColor: 'rgba(19, 6, 28, 0.65)', // Transparent frosted header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: THEME.marigold.bright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.marigold.light,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.18)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 11, 43, 0.45)', // Transparent glass search
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.18)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.iceSilver.pure,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.iceSilver.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.marigold.bright,
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(30, 11, 43, 0.35)',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.12)',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.iceSilver.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 26,
    right: 22,
    backgroundColor: THEME.marigold.bright, // Vivid Marigold 3D Orb
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.aubergine.darkest,
    letterSpacing: 0.4,
  },
});
