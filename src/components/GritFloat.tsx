/**
 * GritFloat — imperative floating label that fires on wrong/failed-through taps.
 *
 * Spec ref: spec.md > Question flow > GritFloat
 * PRD ref: Story 2.4, 2.5
 *
 * API: forwardRef + fire(position, label) — called from QuestionPhase useEffect.
 * Uses Reanimated useSharedValue + useAnimatedStyle so the animation runs on the
 * UI thread (smooth on both native and web).
 *
 * Multiple fires overlap gracefully: each call to fire() resets values and
 * re-launches withTiming. Because the animation is short (600ms) Reanimated
 * simply overwrites the running animation.
 *
 * Positioned absolutely, pointerEvents="none", high zIndex so it never blocks
 * option card taps.
 */

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '../theme/motion';

// ── Public API ────────────────────────────────────────────────────────────────
export type GritFloatRef = {
  fire: (position: { x: number; y: number }, label: string) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────
export const GritFloat = forwardRef<GritFloatRef, object>((_, ref) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Track position and label via state so re-renders happen when fire() is called
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState('');
  // Key counter forces remount on rapid successive fires for web correctness
  const keyRef = useRef(0);
  const [animKey, setAnimKey] = useState(0);

  useImperativeHandle(ref, () => ({
    fire(position: { x: number; y: number }, newLabel: string) {
      // Reset to initial visible state
      opacity.value = 1;
      translateY.value = 0;

      setPos(position);
      setLabel(newLabel);
      keyRef.current += 1;
      setAnimKey(keyRef.current);

      // Animate out: fade to 0 + float up -60
      opacity.value = withTiming(0, { duration: motion.gritFloatMs });
      translateY.value = withTiming(-60, { duration: motion.gritFloatMs });
    },
  }));

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        key={animKey}
        style={[
          styles.floatBox,
          { left: pos.x - 60, top: pos.y - 20 },
          animStyle,
        ]}
      >
        <Text style={styles.floatText}>{label}</Text>
      </Animated.View>
    </View>
  );
});

GritFloat.displayName = 'GritFloat';

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    // pointerEvents="none" is passed as prop; this prevents layout interference
  },
  floatBox: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  floatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32', // muted dark-green — NOT red
  },
});
