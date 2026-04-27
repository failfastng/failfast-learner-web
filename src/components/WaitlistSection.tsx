import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { locked } from '../copy/locked';
import { getDisplayName } from '../lib/displayName';
import { shareApp } from '../lib/share';
import { useWaitlist } from '../hooks/useWaitlist';

type Props = {
  variant: 'standard' | 'all_skilled';
  alreadyWaitlisted?: boolean;
  onWaitlisted?: () => void;
};

export function WaitlistSection({ variant, alreadyWaitlisted = false, onWaitlisted }: Props) {
  const { submit, isSubmitting, justSubmitted, networkError, retryLast, emailError, onBlurValidate } =
    useWaitlist(onWaitlisted);
  const [email, setEmail] = useState('');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const name = getDisplayName() || locked.learnerFallback;

  // ALL_SKILLED state 3 — already waitlisted and we haven't just submitted
  // SummaryPhase controls whether to render this at all, but guard here too.
  if (alreadyWaitlisted && !justSubmitted) return null;

  // Thank-you state (just submitted OR returning after submit)
  if (justSubmitted || alreadyWaitlisted) {
    const thankYouText = locked.waitlistThankYou.replace('[Name]', name);
    return (
      <View style={styles.thankYou}>
        <Text style={styles.thankYouText}>{thankYouText}</Text>
        <Pressable
          style={styles.shareBtn}
          onPress={() => shareApp()}
          accessibilityRole="button"
        >
          <Text style={styles.shareBtnText}>{locked.waitlistShareButton}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header — suppressed in ALL_SKILLED (mission paragraph takes its place) */}
      {variant === 'standard' && (
        <Text style={styles.header}>{locked.waitlistHeader}</Text>
      )}

      {/* Email input */}
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        value={email}
        onChangeText={setEmail}
        onBlur={() => onBlurValidate(email)}
        placeholder="you@example.com"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Email address"
        editable={!isSubmitting}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Submit button */}
      <Pressable
        style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
        onPress={() => submit(email)}
        disabled={!isValid || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={locked.waitlistButton}
        accessibilityState={{ disabled: !isValid || isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>{locked.waitlistButton}</Text>
        )}
      </Pressable>

      {/* Disclosure */}
      <Text style={styles.disclosure}>
        {locked.waitlistDisclosure}{' '}
        <Text
          style={styles.privacyLink}
          onPress={() => Linking.openURL('https://failfastng.com/privacy')}
          accessibilityRole="link"
        >
          Privacy
        </Text>
      </Text>

      {/* Network error — inline retry (Toast is not yet implemented) */}
      {networkError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{locked.toastCouldNotReach}</Text>
          <Pressable onPress={retryLast} accessibilityRole="button">
            <Text style={styles.retryLink}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    fontSize: 12,
    color: '#e53e3e',
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  disclosure: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  privacyLink: {
    textDecorationLine: 'underline',
  },
  thankYou: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    gap: 12,
  },
  thankYouText: {
    fontSize: 15,
    color: '#166534',
    lineHeight: 22,
  },
  shareBtn: {
    alignSelf: 'flex-start',
  },
  shareBtnText: {
    fontSize: 14,
    color: '#166534',
    textDecorationLine: 'underline',
  },
  errorBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#c53030',
    lineHeight: 18,
  },
  retryLink: {
    fontSize: 13,
    color: '#c53030',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
