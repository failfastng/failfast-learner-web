// Subject-specific colors for the level-up bar.
// Placeholder values — Item 20 polishes against the Things 3 tonal anchor.

export const subjectColors = {
  maths: { primary: '#4A6CF7', light: '#EEF1FE' },
  english: { primary: '#10B981', light: '#ECFDF5' },
  economics: { primary: '#F59E0B', light: '#FFFBEB' },
} as const;

export type SubjectColorKey = keyof typeof subjectColors;
