import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export const LoginScreen: React.FC = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [receivedMockOtp, setReceivedMockOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Server URL configuration for physical device testing
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentApiUrl(url);
      setCustomUrlInput(url);
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    const cleanedPhone = phone.trim();

    if (!cleanedPhone || cleanedPhone.length < 10) {
      setErrorMessage('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(cleanedPhone);
      if (res.success) {
        setStep('otp');
        setResendCountdown(30);
        if (res.mockOtp) {
          setReceivedMockOtp(res.mockOtp);
        }
      } else {
        setErrorMessage(res.message || 'Failed to send OTP. Is the backend running?');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), otp.trim());
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!customUrlInput.trim()) return;
    await setApiBaseUrl(customUrlInput.trim());
    setCurrentApiUrl(customUrlInput.trim());
    setShowServerConfig(false);
    Alert.alert('Server URL Updated', `Connecting to: ${customUrlInput.trim()}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand / Logo Section */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.appTagline}>Track money lent to friends effortlessly</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {step === 'phone' ? (
            <View>
              <Text style={styles.cardTitle}>Sign In / Sign Up</Text>
              <Text style={styles.cardDescription}>
                Enter your phone number to receive a one-time verification code.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputWrapper}>
                  <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Mock OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.otpHeader}>
                <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Enter OTP</Text>
                  <Text style={styles.cardDescription}>
                    Sent to <Text style={{ fontWeight: '700', color: '#0F172A' }}>{phone}</Text>
                  </Text>
                </View>
              </View>

              {/* Dev Helper Info Banner */}
              <View style={styles.devOtpBanner}>
                <Ionicons name="information-circle" size={18} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.devOtpTitle}>Mock OTP Service Active</Text>
                  <Text style={styles.devOtpSub}>
                    Check backend terminal for OTP log, or use the dev shortcut below:
                  </Text>
                  <TouchableOpacity
                    style={styles.autoFillChip}
                    onPress={() => setOtp(receivedMockOtp || '123456')}
                  >
                    <Ionicons name="flash" size={14} color="#0284C7" />
                    <Text style={styles.autoFillText}>
                      Auto-fill OTP ({receivedMockOtp || '123456'})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit Verification Code</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                {resendCountdown > 0 ? (
                  <Text style={styles.resendDisabledText}>
                    Resend OTP in {resendCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendActiveText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Server Config Drawer Toggle */}
        <View style={styles.serverConfigContainer}>
          <TouchableOpacity
            style={styles.serverConfigToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Ionicons name="server-outline" size={14} color="#64748B" />
            <Text style={styles.serverConfigToggleText}>
              Backend: {currentApiUrl}
            </Text>
            <Ionicons
              name={showServerConfig ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#64748B"
            />
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigHelp}>
                If testing from a physical phone on local Wi-Fi, change localhost to your computer's IP (e.g. http://192.168.1.5:5000).
              </Text>
              <TextInput
                style={styles.serverInput}
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                placeholder="http://localhost:5000"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveApiUrl}>
                <Text style={styles.serverSaveBtnText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium dark slate
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#4F46E5', // Electric indigo
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  devOtpBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 18,
  },
  devOtpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  devOtpSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    lineHeight: 15,
  },
  autoFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  autoFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 10,
    height: 56,
    color: '#0F172A',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  resendDisabledText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  resendActiveText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '700',
  },
  serverConfigContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  serverConfigToggleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  serverConfigBox: {
    marginTop: 10,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    width: '100%',
  },
  serverConfigHelp: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  serverInput: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    marginBottom: 8,
  },
  serverSaveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  serverSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
