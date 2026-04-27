import { useState, useRef } from 'react';
import { setWaitlistedAt } from '../lib/storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useWaitlist(onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const lastEmailRef = useRef<string>('');

  function validateEmail(email: string): string | null {
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_RE.test(email)) return 'Enter a valid email address';
    return null;
  }

  async function doSubmit(email: string): Promise<void> {
    setIsSubmitting(true);
    setNetworkError(false);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'summary_screen', hp: '' }),
      });
      if (!res.ok && res.status !== 200) throw new Error(`status ${res.status}`);
      setWaitlistedAt(new Date().toISOString());
      setJustSubmitted(true);
      onSuccess?.();
    } catch {
      setNetworkError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit(email: string): Promise<void> {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError(null);
    lastEmailRef.current = email;
    await doSubmit(email);
  }

  function retryLast(): void {
    if (lastEmailRef.current) doSubmit(lastEmailRef.current);
  }

  function onBlurValidate(email: string): void {
    setEmailError(validateEmail(email));
  }

  return {
    submit,
    isSubmitting,
    justSubmitted,
    networkError,
    retryLast,
    emailError,
    onBlurValidate,
  };
}
