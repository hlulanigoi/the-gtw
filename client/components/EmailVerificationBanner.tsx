import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { user, sendEmailVerification, refreshUser } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setSending(true);
      await sendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshUser();
      if (user.emailVerified) {
        Alert.alert('Success', 'Your email has been verified!');
      } else {
        Alert.alert('Not Verified', 'Please verify your email and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh verification status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.message}>
            Please verify your email address to access all features.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleResendVerification}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? 'Sending...' : 'Resend Email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefresh}
        >
          <Text style={styles.buttonText}>I've Verified</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#856404',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
