import React from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme/colors';

interface ReceiptModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="receipt-outline" size={18} color={THEME.marigold.bright} />
              <Text style={styles.title}>Attached Receipt</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={THEME.iceSilver.pure} />
            </TouchableOpacity>
          </View>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 3, 16, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    height: '78%',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 11, 43, 0.75)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.25)',
    padding: 16,
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.iceSilver.pure,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(19, 6, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.12)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
