// Subject-specific colors for the level-up bar.
// Tuned for Item 20 polish — Things 3 tonal anchor: muted, distinguishable,
// colorblind-safe, WCAG AA contrast on white (#fff).
//
// Maths    → blue family    (#3B5FC0 ≈ 5.1:1 on white — AA pass)
// English  → amber family   (#92620A ≈ 5.6:1 on white — AA pass)
// Economics → green family  (#2D6A4F ≈ 6.2:1 on white — AA pass)

export const subjectColors = {
  maths: { primary: '#3B5FC0', light: '#EEF1FB' },
  english: { primary: '#92620A', light: '#FEF3DC' },
  economics: { primary: '#2D6A4F', light: '#E8F5EE' },
} as const;

export type SubjectColorKey = keyof typeof subjectColors;
