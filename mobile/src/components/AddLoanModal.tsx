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
import { THEME } from '../theme/colors';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLoanPayload) => Promise<{ success: boolean; message?: string }>;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({ visible, onClose, onSubmit }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setPresetDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please grant access to your photo library to attach a receipt.');
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
      Alert.alert('Error', 'Camera unavailable on this device or browser.');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

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
              <Text style={styles.subtitle}>Track money lent in 3D precision</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={THEME.iceSilver.main} />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={THEME.marigold.bright} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Friend Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Friend's Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={THEME.marigold.bright} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={THEME.iceSilver.dark}
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
                  placeholderTextColor={THEME.iceSilver.dark}
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
                <Ionicons name="calendar-outline" size={18} color={THEME.marigold.bright} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={THEME.iceSilver.dark}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              {/* Quick 3D Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    dueDate === new Date().toISOString().split('T')[0] && styles.presetChipActive,
                  ]}
                  onPress={() => setPresetDate(0)}
                >
                  <Text style={styles.presetText}>Today</Text>
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

                <TouchableOpacity
                  style={[styles.presetChip, styles.presetChipPast]}
                  onPress={() => setPresetDate(-3)}
                >
                  <Ionicons name="flame" size={12} color={THEME.marigold.bright} />
                  <Text style={[styles.presetText, { color: THEME.marigold.bright }]}>
                    Past (Overdue Test)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <View style={[styles.inputWrapper, { height: 70, alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                  placeholder="e.g. Dinner split, concert tickets"
                  placeholderTextColor={THEME.iceSilver.dark}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Bonus: Receipt Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt Photo (Bonus)</Text>

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
                    <Ionicons name="images-outline" size={18} color={THEME.marigold.bright} />
                    <Text style={styles.photoPickerText}>Choose Photo</Text>
                  </TouchableOpacity>

                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={styles.photoPickerBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera-outline" size={18} color={THEME.marigold.bright} />
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
                <ActivityIndicator color={THEME.aubergine.darkest} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={THEME.aubergine.darkest} />
                  <Text style={styles.submitButtonText}>Create Loan Entry</Text>
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
    backgroundColor: 'rgba(10, 3, 16, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'rgba(30, 11, 43, 0.95)', // Deep Aubergine Frost
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.25)',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.iceSilver.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: THEME.marigold.bright,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: THEME.marigold.light,
    fontWeight: '700',
    flex: 1,
  },
  scroll: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.iceSilver.metallic,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.18)',
    borderRadius: 14,
    backgroundColor: 'rgba(19, 6, 28, 0.6)',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.marigold.bright,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.iceSilver.pure,
  },
  amountInput: {
    fontWeight: '900',
    fontSize: 18,
    color: THEME.marigold.bright,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: THEME.marigold.bright,
    borderColor: THEME.marigold.bright,
  },
  presetChipPast: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: THEME.marigold.bright,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.iceSilver.pure,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 50,
  },
  photoPickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.marigold.bright,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.25)',
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
    backgroundColor: THEME.overdue.main,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: THEME.marigold.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.aubergine.darkest,
    letterSpacing: 0.3,
  },
});
