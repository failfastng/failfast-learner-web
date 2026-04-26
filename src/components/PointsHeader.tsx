/**
 * PointsHeader — session scoring header with animated counters.
 *
 * Spec ref: spec.md > Question flow > PointsHeader
 * PRD ref: Story 2.2 (header hierarchy), Story 2.4 (attempt counter)
 *
 * Visual-weight hierarchy (loudest → quietest):
 *   Total Points → Success/Grit sub-values → AttemptCounter
 *
 * AttemptCounter:
 *   - Hidden until first wrong tap (tappedWrongCount > 0)
 *   - Shows e.g. "2 attempts left" = 3 - currentAttempt
 *   - Hides on NEXT_QUESTION (tappedWrongCount resets to 0)
 *
 * Grit counter ticks up immediately on wrong tap via animated shared value.
 * Total counter ticks up on correct answer.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../theme/motion';

// ── Animated Text helper ──────────────────────────────────────────────────────
// Reanimated v4 does not support animatedProps on Text for 'text' content
// on web without extra setup, so we use a plain useEffect-driven state approach
// for the counter display. The animation is a CSS-level opacity/scale pulse
// to signal the change, while the numeric value updates instantly.

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  sessionSuccess: number;
  sessionGrit: number;
  tappedWrongCount: number;   // state.tappedWrongIndices.length
  currentAttempt: 1 | 2 | 3;
  lastResolution: 'pending' | 'correct' | 'failed-through';
};

// ── Component ─────────────────────────────────────────────────────────────────
export function PointsHeader({
  sessionSuccess,
  sessionGrit,
  tappedWrongCount,
  currentAttempt,
  lastResolution,
}: Props) {
  const total = sessionSuccess + sessionGrit;

  // Pulse animations when values change
  const gritScale = useSharedValue(1);
  const totalScale = useSharedValue(1);

  // Pulse grit counter on wrong tap
  useEffect(() => {
    if (tappedWrongCount > 0) {
      gritScale.value = 1.25;
      gritScale.value = withTiming(1, { duration: motion.counterTickMs });
    }
  }, [sessionGrit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse total counter on correct answer
  useEffect(() => {
    if (lastResolution === 'correct') {
      totalScale.value = 1.25;
      totalScale.value = withTiming(1, { duration: motion.counterTickMs });
    }
  }, [lastResolution]); // eslint-disable-line react-hooks/exhaustive-deps

  const gritAnimStyle = {
    transform: [{ scale: gritScale.value }],
  };

  const totalAnimStyle = {
    transform: [{ scale: totalScale.value }],
  };

  // AttemptCounter: shown only after first wrong tap, hidden on resolution reset
  const showAttemptCounter = tappedWrongCount > 0 && lastResolution === 'pending';
  const attemptsLeft = Math.max(0, 3 - currentAttempt);

  return (
    <View style={styles.container} accessibilityRole="header">
      {/* Total — hero number */}
      <Animated.View style={totalAnimStyle}>
        <Text style={styles.totalLabel}>Total Points</Text>
        <Text style={styles.totalValue}>{total}</Text>
      </Animated.View>

      {/* Success / Grit sub-values */}
      <View style={styles.subRow}>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>Success</Text>
          <Text style={styles.subValue}>{sessionSuccess}</Text>
        </View>
        <View style={styles.subDivider} />
        <Animated.View style={[styles.subItem, gritAnimStyle]}>
          <Text style={styles.subLabel}>Grit</Text>
          <Text style={styles.subValue}>{sessionGrit}</Text>
        </Animated.View>
      </View>

      {/* AttemptCounter — only after first wrong tap */}
      {showAttemptCounter && (
        <Text style={styles.attemptCounter} accessibilityLiveRegion="polite">
          {attemptsLeft === 1 ? '1 attempt left' : `${attemptsLeft} attempts left`}
        </Text>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    lineHeight: 38,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  subLabel: {
    fontSize: 12,
    color: '#888',
  },
  subValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  subDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#ddd',
  },
  // AttemptCounter — quiet, informational only
  attemptCounter: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
