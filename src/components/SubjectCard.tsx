import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { subjectColors } from '../theme/subject';
import { fontSize, fontWeight } from '../theme/type';
import { locked } from '../copy/locked';
import type { Subject, Tier } from '../types/domain';

// ── Skilled threshold (158 Success Points) ────────────────────────────────────
export const SKILLED_THRESHOLD = 158;

// ── Sub-label map ─────────────────────────────────────────────────────────────
const SUB_LABELS: Record<Subject, string> = {
  maths: locked.subjectSubLabelMaths,
  english: locked.subjectSubLabelEnglish,
  economics: locked.subjectSubLabelEconomics,
};

const SUBJECT_LABELS: Record<Subject, string> = {
  maths: locked.subjectLabelMaths,
  english: locked.subjectLabelEnglish,
  economics: locked.subjectLabelEconomics,
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface BaseProps {
  subject: Subject;
  isSelected: boolean;
  onSelect: () => void;
  isNotStarted?: boolean;
}

interface SimpleProps extends BaseProps {
  variant: 'simple';
}

interface WithProgressProps extends BaseProps {
  variant: 'with-progress';
  tier: Tier;
  successPoints: number; // raw value — fill % derived, no number shown
}

type SubjectCardProps = SimpleProps | WithProgressProps;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SubjectCard(props: SubjectCardProps) {
  const { subject, isSelected, onSelect, isNotStarted } = props;

  const accentColor = subjectColors[subject].primary;
  const accentLight = subjectColors[subject].light;

  const containerStyle = [
    styles.card,
    isSelected && { borderColor: accentColor, borderWidth: 2, backgroundColor: accentLight },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onSelect}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Select ${SUBJECT_LABELS[subject]}`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={styles.subjectName}>{SUBJECT_LABELS[subject]}</Text>
          <Text style={styles.subLabel}>
            {isNotStarted && props.variant === 'with-progress'
              ? 'Not started'
              : SUB_LABELS[subject]}
          </Text>
        </View>

        {/* Tier badge — with-progress variant only */}
        {props.variant === 'with-progress' && (
          <View
            style={[
              styles.tierBadge,
              props.tier === 'Skilled' && { backgroundColor: accentColor },
            ]}
          >
            <Text
              style={[
                styles.tierText,
                props.tier === 'Skilled' && { color: '#FFFFFF' },
              ]}
            >
              {props.tier}
            </Text>
          </View>
        )}

        {/* Checkmark — simple variant when selected */}
        {props.variant === 'simple' && isSelected && (
          <View style={[styles.checkmark, { backgroundColor: accentColor }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Progress bar — with-progress variant only */}
      {props.variant === 'with-progress' && (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                backgroundColor: accentColor,
                width: `${Math.min(
                  100,
                  (props.successPoints / SKILLED_THRESHOLD) * 100
                )}%` as unknown as number,
              },
            ]}
            accessibilityLabel={`${props.tier} progress`}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flex: 1,
    marginRight: 8,
  },
  subjectName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  subLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tierText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.borderSubtle,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
