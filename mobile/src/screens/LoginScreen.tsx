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
import { THEME } from '../theme/colors';
import { ThreeDBackground } from '../components/ThreeDBackground';
import { ThreeDTiltCard } from '../components/ThreeDTiltCard';

export const LoginScreen: React.FC = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [receivedMockOtp, setReceivedMockOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentApiUrl(url);
      setCustomUrlInput(url);
    });
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '').trim();

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

    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '').trim();
    setIsLoading(true);
    try {
      const res = await verifyOtp(cleanedPhone, otp.trim());
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
    <ThreeDBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet-outline" size={38} color={THEME.marigold.bright} />
              <View style={styles.logoOrbGlow} />
            </View>
            <Text style={styles.appName}>MiniLedger</Text>
            <Text style={styles.appTagline}>
              Track money lent to friends in <Text style={{ color: THEME.marigold.bright, fontWeight: '700' }}>3D Precision</Text>
            </Text>
          </View>

          {/* 3D Glassmorphic Auth Card */}
          <View style={styles.cardWrapper}>
            <ThreeDTiltCard maxTilt={10} style={styles.tiltCard}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={THEME.marigold.bright} />
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
                      <Ionicons
                        name="call-outline"
                        size={18}
                        color={THEME.marigold.bright}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="+91 98765 43210"
                        placeholderTextColor={THEME.iceSilver.dark}
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
                      <ActivityIndicator color={THEME.aubergine.darkest} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Send Mock OTP</Text>
                        <Ionicons name="arrow-forward" size={18} color={THEME.aubergine.darkest} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.otpHeader}>
                    <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
                      <Ionicons name="arrow-back" size={18} color={THEME.iceSilver.pure} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Verify OTP</Text>
                      <Text style={styles.cardDescription}>
                        Sent to{' '}
                        <Text style={{ fontWeight: '800', color: THEME.marigold.bright }}>
                          {phone}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Dev Helper Banner */}
                  <View style={styles.devOtpBanner}>
                    <Ionicons name="code-slash" size={18} color={THEME.marigold.bright} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.devOtpTitle}>Mock OTP Active in Terminal</Text>
                      <Text style={styles.devOtpSub}>
                        Check server console or tap below to auto-fill:
                      </Text>
                      <TouchableOpacity
                        style={styles.autoFillChip}
                        onPress={() => setOtp(receivedMockOtp || '123456')}
                      >
                        <Ionicons name="flash" size={13} color={THEME.aubergine.darkest} />
                        <Text style={styles.autoFillText}>
                          Auto-fill OTP ({receivedMockOtp || '123456'})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>6-Digit Passcode</Text>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="• • • • • •"
                      placeholderTextColor={THEME.iceSilver.dark}
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
                      <ActivityIndicator color={THEME.aubergine.darkest} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Verify & Enter</Text>
                        <Ionicons name="checkmark-circle" size={18} color={THEME.aubergine.darkest} />
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendRow}>
                    {resendCountdown > 0 ? (
                      <Text style={styles.resendDisabledText}>
                        Resend code in {resendCountdown}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp}>
                        <Text style={styles.resendActiveText}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </ThreeDTiltCard>
          </View>

          {/* Server Config Toggle */}
          <View style={styles.serverConfigContainer}>
            <TouchableOpacity
              style={styles.serverConfigToggle}
              onPress={() => setShowServerConfig(!showServerConfig)}
            >
              <Ionicons name="server-outline" size={13} color={THEME.iceSilver.muted} />
              <Text style={styles.serverConfigToggleText}>Backend: {currentApiUrl}</Text>
              <Ionicons
                name={showServerConfig ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={THEME.iceSilver.muted}
              />
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverConfigBox}>
                <Text style={styles.serverConfigHelp}>
                  If using physical device with Expo Go, enter your machine's Wi-Fi IP (e.g. http://192.168.1.5:5000).
                </Text>
                <TextInput
                  style={styles.serverInput}
                  value={customUrlInput}
                  onChangeText={setCustomUrlInput}
                  placeholder="http://localhost:5000"
                  placeholderTextColor={THEME.iceSilver.dark}
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
    </ThreeDBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: 'rgba(30, 11, 43, 0.65)',
    borderWidth: 1.5,
    borderColor: THEME.marigold.bright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  logoOrbGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  appTagline: {
    fontSize: 14,
    color: THEME.iceSilver.muted,
    marginTop: 6,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  tiltCard: {
    padding: 26,
    backgroundColor: 'rgba(30, 11, 43, 0.55)', // Transparent Deep Aubergine
    borderColor: 'rgba(226, 232, 240, 0.25)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.iceSilver.pure,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: THEME.iceSilver.muted,
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: THEME.overdue.bright,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 12,
    color: THEME.overdue.bright,
    fontWeight: '700',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.iceSilver.metallic,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.18)',
    borderRadius: 16,
    backgroundColor: 'rgba(19, 6, 28, 0.65)',
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.iceSilver.pure,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: THEME.marigold.bright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    shadowColor: THEME.marigold.bright,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.aubergine.darkest,
    letterSpacing: 0.3,
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
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
  },
  devOtpBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  devOtpTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.marigold.bright,
  },
  devOtpSub: {
    fontSize: 11,
    color: THEME.iceSilver.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  autoFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.marigold.bright,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  autoFillText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.aubergine.darkest,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: THEME.marigold.bright,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 6, 28, 0.75)',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 12,
    height: 58,
    color: THEME.marigold.bright,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  resendDisabledText: {
    fontSize: 12,
    color: THEME.iceSilver.dark,
    fontWeight: '600',
  },
  resendActiveText: {
    fontSize: 13,
    color: THEME.marigold.bright,
    fontWeight: '800',
  },
  serverConfigContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(226, 232, 240, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.15)',
  },
  serverConfigToggleText: {
    fontSize: 11,
    color: THEME.iceSilver.muted,
    fontWeight: '600',
  },
  serverConfigBox: {
    marginTop: 10,
    backgroundColor: 'rgba(30, 11, 43, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.2)',
    padding: 14,
    borderRadius: 16,
    width: '100%',
    maxWidth: 440,
  },
  serverConfigHelp: {
    fontSize: 11,
    color: THEME.iceSilver.muted,
    marginBottom: 8,
  },
  serverInput: {
    backgroundColor: 'rgba(10, 3, 16, 0.75)',
    color: THEME.iceSilver.pure,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    marginBottom: 8,
  },
  serverSaveBtn: {
    backgroundColor: THEME.marigold.bright,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  serverSaveBtnText: {
    color: THEME.aubergine.darkest,
    fontSize: 12,
    fontWeight: '900',
  },
});
