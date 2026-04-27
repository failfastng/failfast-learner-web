/**
 * OptionCard — a single answer option in the question flow.
 *
 * Spec ref: spec.md > Question flow > OptionCard
 * PRD ref: Stories 2.3, 2.4, 2.5, 2.6
 *
 * States:
 *  • Default: tappable, full opacity
 *  • isTappedWrong: opacity animates 1→0.45 over 200ms, strike-through text,
 *    no press handler. NO red color, NO shake. (Principle #3: information signal)
 *  • isRevealed + isCorrect: muted green background (pastel)
 *  • isRevealed + !isCorrect: same gray fade as wrong-tapped
 */

import React, { useEffect } from 'react';
import {
  AccessibilityState,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  text: string;
  isTappedWrong?: boolean;
  isRevealed?: boolean;
  isCorrect?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
};

// ── Animated wrapper for the card ─────────────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Component ─────────────────────────────────────────────────────────────────
export function OptionCard({
  text,
  isTappedWrong = false,
  isRevealed = false,
  isCorrect = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const opacity = useSharedValue(1);

  // Fade to 0.45 when tapped wrong or revealed-as-wrong
  const shouldFade = isTappedWrong || (isRevealed && !isCorrect);

  useEffect(() => {
    if (shouldFade) {
      opacity.value = withTiming(0.45, { duration: 200 });
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [shouldFade]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Determine background/border style
  const isRevealedCorrect = isRevealed && isCorrect;
  const isDisabled = isTappedWrong || isRevealed || !onPress;

  const accessibilityStateObj: AccessibilityState = { disabled: isDisabled };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        isRevealedCorrect && styles.cardCorrect,
        shouldFade && styles.cardFaded,
        animStyle,
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityRole="button"
      accessibilityState={accessibilityStateObj}
    >
      <Text
        style={[
          styles.text,
          shouldFade && styles.textFaded,
          isRevealedCorrect && styles.textCorrect,
        ]}
      >
        {text}
      </Text>
    </AnimatedPressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  cardFaded: {
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
  },
  // Muted pastel green — NOT vivid. No red anywhere.
  cardCorrect: {
    borderColor: '#81c784',
    backgroundColor: '#f1f8f1',
  },
  text: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  textFaded: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  textCorrect: {
    color: '#2e7d32',
  },
});
