import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { CreateLoanPayload } from '../types';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLoanPayload) => Promise<{ success: boolean; message?: string }>;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({ visible, onClose, onSubmit }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default to 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to set preset dates
  const setPresetDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to attach a receipt.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Image picker error:', e);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please grant camera access to take a receipt photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Camera error:', e);
      Alert.alert('Error', 'Camera unavailable on this device or simulator.');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    // Validation
    if (!friendName.trim()) {
      setErrorMessage('Please enter the friend’s name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid loan amount greater than ₹0.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setErrorMessage('Due date must be in YYYY-MM-DD format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate: dueDate.trim(),
        notes: notes.trim() || undefined,
        receiptUri,
      });

      if (res.success) {
        // Reset form
        setFriendName('');
        setAmount('');
        setNotes('');
        setReceiptUri(null);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to save loan entry');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New Loan Entry</Text>
              <Text style={styles.subtitle}>Track money you lent to a friend</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Friend Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Friend's Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                  value={friendName}
                  onChangeText={setFriendName}
                />
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Lent (₹) *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={[styles.textInput, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* Due Date & Quick Presets */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[styles.presetChip, dueDate === new Date().toISOString().split('T')[0] && styles.presetChipActive]}
                  onPress={() => setPresetDate(0)}
                >
                  <Text style={[styles.presetText, dueDate === new Date().toISOString().split('T')[0] && styles.presetTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(1)}>
                  <Text style={styles.presetText}>Tomorrow</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(7)}>
                  <Text style={styles.presetText}>+1 Week</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(30)}>
                  <Text style={styles.presetText}>+1 Month</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.presetChip, styles.presetChipPast]} onPress={() => setPresetDate(-3)}>
                  <Text style={[styles.presetText, styles.presetTextPast]}>Past (Overdue Test)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <View style={[styles.inputWrapper, { height: 70, alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                  placeholder="e.g. Dinner split, movie tickets"
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Bonus: Receipt Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt Photo (Optional Bonus)</Text>

              {receiptUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: receiptUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setReceiptUri(null)}
                  >
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images-outline" size={18} color="#0284C7" />
                    <Text style={styles.photoPickerText}>Choose Photo</Text>
                  </TouchableOpacity>

                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={styles.photoPickerBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera-outline" size={18} color="#0284C7" />
                      <Text style={styles.photoPickerText}>Take Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Add Loan Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  scroll: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  amountInput: {
    fontWeight: '700',
    fontSize: 17,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  presetChipActive: {
    backgroundColor: '#0F172A',
  },
  presetChipPast: {
    backgroundColor: '#FEE2E2',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  presetTextPast: {
    color: '#DC2626',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 48,
  },
  photoPickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
