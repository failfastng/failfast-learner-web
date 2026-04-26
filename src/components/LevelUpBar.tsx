/**
 * LevelUpBar — tier progression bar shown in PointsHeader.
 *
 * Spec ref: checklist item 11 — level-up bar + tier progression
 *
 * Props:
 *   subject        — current subject (used for color theming)
 *   successPoints  — cumulative success points (snapshot + session running total)
 *
 * Threshold = 158.
 * Fill = Math.min(100, (successPoints / 158) * 100)
 * Animates via Reanimated withTiming(500ms).
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';
import { subjectColors } from '../theme/subject';
import type { Subject } from '../types/domain';

const THRESHOLD = 158;

type Props = {
  subject: Subject;
  successPoints: number;
};

function subjectLabel(subject: Subject): string {
  if (subject === 'maths') return 'Maths';
  if (subject === 'english') return 'English';
  return 'Economics';
}

export function LevelUpBar({ subject, successPoints }: Props) {
  const isSkilled = successPoints >= THRESHOLD;
  const fillPercent = Math.min(100, (successPoints / THRESHOLD) * 100);

  const animatedFill = useSharedValue(fillPercent);

  useEffect(() => {
    animatedFill.value = withTiming(fillPercent, { duration: 500 });
  }, [fillPercent]); // eslint-disable-line react-hooks/exhaustive-deps

  const colors = subjectColors[subject];
  const leftLabel = isSkilled
    ? `${subjectLabel(subject)}: Skilled`
    : `${subjectLabel(subject)}: Rookie`;

  return (
    <View style={styles.container}>
      {/* Labels */}
      <View style={styles.labelRow}>
        <Text style={styles.leftLabel}>{leftLabel}</Text>
        <Text style={styles.rightLabel}>Skilled</Text>
      </View>

      {/* Bar track */}
      <View style={[styles.track, { backgroundColor: colors.light }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${animatedFill.value}%` as unknown as number,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  rightLabel: {
    fontSize: 11,
    color: '#aaa',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
