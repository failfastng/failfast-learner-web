/**
 * SummaryPhase — shown after a session ends.
 *
 * Spec ref: Item 14 — Summary variants + MathBlock + selectSummaryVariant
 *
 * Variants:
 *   PERFECT      — all first-try correct
 *   RECOVERY     — total === perfectTotal but not all first-try
 *   STRUGGLE     — total !== perfectTotal (grit > success)
 *   ALL_SKILLED  — all three subjects at Skilled tier (supersedes everything)
 *     renderState 1 — waitlist not yet joined
 *     renderState 3 — already waitlisted
 */

import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getProgress, getWaitlistedAt } from '../../lib/storage';
import { WaitlistSection } from '../../components/WaitlistSection';
import { getDisplayName } from '../../lib/displayName';
import type { Href } from 'expo-router';
import { hashDisplayName } from '../../lib/hash';
import { buildSessionEndPayload, postSessionEnd, postReview } from '../../lib/analytics';
import { selectSummaryVariant, countCorrections, countWalkThroughs } from '../../lib/summary';
import { shareApp } from '../../lib/share';
import { locked } from '../../copy/locked';
import { Toast } from '../../components/Toast';
import type { Action } from '../../hooks/useSessionReducer';
import type { SessionState, Subject } from '../../types/domain';
import ResetConfirmModal from '../../components/ResetConfirmModal';

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  subject: Subject;
};

// ── Subject label map ─────────────────────────────────────────────────────────
const SUBJECT_LABELS: Record<Subject, string> = {
  maths: 'Mathematics',
  english: 'English',
  economics: 'Economics',
};

// ── MathBlock ─────────────────────────────────────────────────────────────────
function MathBlock({ state }: { state: SessionState }) {
  const answered = state.outcomes.filter((o) => o !== 'abandoned').length;
  const corrections = countCorrections(state.outcomes);
  const walkThroughs = countWalkThroughs(state.outcomes);
  const firstTry = state.outcomes.filter((o) => o === 'first_try_correct').length;
  const total = state.sessionSuccess + state.sessionGrit;

  let prepend: string;
  if (state.abandonedCount === 1) {
    prepend = `You answered ${answered} questions and abandoned 1. Here is what you earned on the ${answered}.`;
  } else if (answered < 10) {
    prepend = `You answered ${answered} of 10 questions. Here is what you earned.`;
  } else {
    prepend = `You answered 10 of 10 questions. Here is what you earned.`;
  }

  return (
    <View style={mathBlockStyles.container}>
      <Text style={mathBlockStyles.prepend}>{prepend}</Text>
      <Text style={mathBlockStyles.totalHero}>{total}</Text>
      <Text style={mathBlockStyles.totalLabel}>Total Points</Text>
      <View style={mathBlockStyles.subRow}>
        <Text style={mathBlockStyles.sub}>{state.sessionSuccess} Success</Text>
        <Text style={mathBlockStyles.subDivider}>·</Text>
        <Text style={mathBlockStyles.sub}>{state.sessionGrit} Grit</Text>
      </View>
      <Text style={mathBlockStyles.breakdown}>
        {firstTry} first-try correct
        {corrections > 0 ? `, ${corrections} correction${corrections !== 1 ? 's' : ''}` : ''}
        {walkThroughs > 0 ? `, ${walkThroughs} walked through` : ''}
      </Text>
    </View>
  );
}

const mathBlockStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  prepend: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  totalHero: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111',
    lineHeight: 56,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#555',
  },
  subDivider: {
    fontSize: 14,
    color: '#bbb',
  },
  breakdown: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});

// ── VisualBreak ────────────────────────────────────────────────────────────────
function VisualBreak() {
  return <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 24 }} />;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SummaryPhase({ state, dispatch, subject }: Props) {
  const router = useRouter();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [waitlistedAt, setWaitlistedAtState] = useState<string | null>(() => getWaitlistedAt());
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewToast, setShowReviewToast] = useState(false);

  function handleReviewSubmit() {
    if (!reviewText.trim()) return;
    postReview(reviewText.trim(), 'summary');
    setReviewSubmitted(true);
    setShowReviewToast(true);
  }

  // Fire session analytics exactly once when summary mounts
  useEffect(() => {
    const sessionStartWaitlistedAt = getWaitlistedAt();
    hashDisplayName(getDisplayName()).then((hash) => {
      const payload = buildSessionEndPayload(state, subject, hash, sessionStartWaitlistedAt);
      postSessionEnd(payload);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute variant ────────────────────────────────────────────────────────
  const allProgress = getProgress();
  const tierState = {
    maths: allProgress.maths.tier,
    english: allProgress.english.tier,
    economics: allProgress.economics.tier,
  } as Record<Subject, 'Rookie' | 'Skilled'>;

  const answered = state.outcomes.filter((o) => o !== 'abandoned').length;
  const sessionStats = {
    questionsAnswered: answered,
    abandonedCount: state.abandonedCount,
    success: state.sessionSuccess,
    grit: state.sessionGrit,
    total: state.sessionSuccess + state.sessionGrit,
    outcomes: state.outcomes,
  };

  const allProgressForVariant: Record<Subject, { successPoints: number }> = {
    maths: { successPoints: allProgress.maths.successPoints },
    english: { successPoints: allProgress.english.successPoints },
    economics: { successPoints: allProgress.economics.successPoints },
  };

  const variantRender = selectSummaryVariant(
    sessionStats,
    tierState,
    waitlistedAt,
    allProgressForVariant,
  );

  // ── VariantBody ───────────────────────────────────────────────────────────
  function VariantBody() {
    if (variantRender.variant === 'PERFECT') {
      const subjectLabel = SUBJECT_LABELS[variantRender.recommendedSubject];
      const body = locked.perfectBody.replace('[Subject]', subjectLabel);
      return <Text style={styles.variantBody}>{body}</Text>;
    }

    if (variantRender.variant === 'RECOVERY') {
      const rn = variantRender.corrections;
      const body = locked.recoveryBody
        .replace(/\[N\] times/g, `${rn} ${rn === 1 ? 'time' : 'times'}`)
        .replace(/\[perfectTotal\]/g, String(variantRender.perfectTotal));
      return <Text style={styles.variantBody}>{body}</Text>;
    }

    if (variantRender.variant === 'STRUGGLE') {
      const template =
        state.sessionGrit > state.sessionSuccess
          ? locked.struggleBodyGritLed
          : locked.struggleBodySuccessLed;
      const m = variantRender.walkThroughs;
      const n = variantRender.corrections;
      const body = template
        .replace(/\[N\] times/g, `${n} ${n === 1 ? 'time' : 'times'}`)
        .replace(/\[M\] questions/g, `${m} ${m === 1 ? 'question' : 'questions'}`)
        .replace(/\[perfectTotal\]/g, String(variantRender.perfectTotal))
        .replace(/\[X\]/g, String(variantRender.actualTotal));
      return <Text style={styles.variantBody}>{body}</Text>;
    }

    // ALL_SKILLED
    if (variantRender.renderState === 3) {
      // Already waitlisted — short body only
      return <Text style={styles.variantBody}>{locked.allSkilledMilestoneBodyShort}</Text>;
    }

    // renderState 1 — not yet waitlisted
    return (
      <>
        <Text style={styles.variantBody}>{locked.allSkilledMilestoneBody}</Text>
        <Text style={[styles.variantBody, { marginTop: 16 }]}>
          {locked.allSkilledMissionParagraph}
        </Text>
      </>
    );
  }

  // ── PrimaryCTA ───────────────────────────────────────────────────────────
  function PrimaryCTA() {
    if (variantRender.variant === 'PERFECT') {
      const rec = variantRender.recommendedSubject;
      const label = `Try ${SUBJECT_LABELS[rec]} →`;
      return (
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            dispatch({ type: 'START_RECOMMENDED_SUBJECT', subject: rec });
            router.push(`/practice/${rec}` as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.primaryButtonText}>{label}</Text>
        </Pressable>
      );
    }

    if (variantRender.variant === 'RECOVERY' || variantRender.variant === 'STRUGGLE') {
      return (
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace(`/practice/${subject}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={locked.practiceAgainCTA}
        >
          <Text style={styles.primaryButtonText}>{locked.practiceAgainCTA}</Text>
        </Pressable>
      );
    }

    // ALL_SKILLED state 1 — waitlist IS primary CTA (rendered by WaitlistSection)
    if (variantRender.renderState === 1) {
      return null;
    }

    // ALL_SKILLED state 3 — Pick a subject
    return (
      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel={locked.pickASubjectCTA}
      >
        <Text style={styles.primaryButtonText}>{locked.pickASubjectCTA}</Text>
      </Pressable>
    );
  }

  // ── TertiaryRow ───────────────────────────────────────────────────────────
  function TertiaryRow() {
    const isAllSkilled = variantRender.variant === 'ALL_SKILLED';
    const renderState = isAllSkilled ? variantRender.renderState : null;

    if (isAllSkilled && renderState === 1) {
      // "Try a different subject" | "Share this app" | "Start over"
      return (
        <View style={styles.tertiaryRow}>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="link"
            accessibilityLabel={locked.tryDifferentSubjectLink}
          >
            <Text style={styles.tertiaryLink}>{locked.tryDifferentSubjectLink}</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const result = await shareApp();
              if (result === 'copied') setShowCopiedToast(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={locked.shareAppLink}
          >
            <Text style={styles.tertiaryLink}>{locked.shareAppLink}</Text>
          </Pressable>
          <Pressable
            onPress={() => setResetModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={locked.startOverLink}
          >
            <Text style={styles.tertiaryLink}>{locked.startOverLink}</Text>
          </Pressable>
        </View>
      );
    }

    if (isAllSkilled && renderState === 3) {
      // "Try a different subject" | "Start over"
      return (
        <View style={styles.tertiaryRow}>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="link"
            accessibilityLabel={locked.tryDifferentSubjectLink}
          >
            <Text style={styles.tertiaryLink}>{locked.tryDifferentSubjectLink}</Text>
          </Pressable>
          <Pressable
            onPress={() => setResetModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={locked.startOverLink}
          >
            <Text style={styles.tertiaryLink}>{locked.startOverLink}</Text>
          </Pressable>
        </View>
      );
    }

    // Standard variants: "Share this app" | "Try a different subject"
    return (
      <View style={styles.tertiaryRow}>
        <Pressable
          onPress={async () => {
            const result = await shareApp();
            if (result === 'copied') setShowCopiedToast(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={locked.shareAppLink}
        >
          <Text style={styles.tertiaryLink}>{locked.shareAppLink}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="link"
          accessibilityLabel={locked.tryDifferentSubjectLink}
        >
          <Text style={styles.tertiaryLink}>{locked.tryDifferentSubjectLink}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const isAllSkilled = variantRender.variant === 'ALL_SKILLED';
  const allSkilledState1 = isAllSkilled && variantRender.renderState === 1;

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* MathBlock — always shown */}
        <MathBlock state={state} />

        {/* VariantBody */}
        <VariantBody />

        {/*
          ALL_SKILLED state 1: WaitlistSection is primary CTA, rendered ABOVE VisualBreak.
          Standard variants: WaitlistSection rendered BELOW VisualBreak.
          ALL_SKILLED state 3: WaitlistSection not rendered.
        */}
        {allSkilledState1 && (
          <WaitlistSection
            variant="all_skilled"
            alreadyWaitlisted={false}
            onWaitlisted={() => setWaitlistedAtState(getWaitlistedAt())}
          />
        )}

        <VisualBreak />

        {!isAllSkilled && (
          <WaitlistSection
            variant="standard"
            alreadyWaitlisted={waitlistedAt !== null}
            onWaitlisted={() => setWaitlistedAtState(getWaitlistedAt())}
          />
        )}

        {/* PrimaryCTA */}
        <PrimaryCTA />

        {/* TertiaryRow */}
        <TertiaryRow />

        {/* Review */}
        {!reviewSubmitted && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewPrompt}>{locked.reviewPromptSummary}</Text>
            <TextInput
              style={styles.reviewInput}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder={locked.reviewPlaceholder}
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              autoCorrect={false}
              autoCapitalize="sentences"
              accessibilityLabel={locked.reviewPromptSummary}
            />
            <Pressable
              style={[styles.reviewButton, !reviewText.trim() && styles.reviewButtonDisabled]}
              onPress={handleReviewSubmit}
              disabled={!reviewText.trim()}
              accessibilityRole="button"
              accessibilityLabel={locked.reviewSubmitButton}
            >
              <Text style={styles.reviewButtonText}>{locked.reviewSubmitButton}</Text>
            </Pressable>
          </View>
        )}

        {/* Reset Confirm Modal */}
        <ResetConfirmModal visible={resetModalOpen} onClose={() => setResetModalOpen(false)} />
      </ScrollView>

      {/* Copied toast — absolute overlay */}
      {showCopiedToast && <Toast message={locked.toastCopied} durationMs={2500} />}

      {/* Review thank-you toast */}
      {showReviewToast && (
        <Toast
          message={locked.reviewThankYouToast}
          durationMs={3000}
          fadeInMs={600}
          fadeOutMs={800}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  variantBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginTop: 24,
  },
  primaryButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
  },
  tertiaryLink: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },
  reviewSection: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 24,
  },
  reviewPrompt: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#111',
    alignSelf: 'flex-end',
  },
  reviewButtonDisabled: {
    backgroundColor: '#ccc',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
