import { useEffect, useRef, useState } from 'react';
import { getQuestionCache, setQuestionCache } from '../lib/storage';
import type { Question } from '../types/domain';

const CACHE_TTL_MS = 86_400_000; // 24 hours

type BankState = {
  bank: Question[];
  isReady: boolean;
  error: boolean;
};

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

async function fetchBank(): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/questions`);
  if (!res.ok) throw new Error(`GET /questions returned ${res.status}`);
  return (await res.json()) as Question[];
}

function shuffleOptions(q: Question): Question {
  const indices = q.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...q,
    options: indices.map((i) => q.options[i]),
    correct_index: indices.indexOf(q.correct_index),
  };
}

function shuffleBank(questions: Question[]): Question[] {
  return questions.map(shuffleOptions);
}

export function useQuestionBank(): BankState {
  const [state, setState] = useState<BankState>({
    bank: [],
    isReady: false,
    error: false,
  });

  // Prevent double-fetch in StrictMode
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const cached = getQuestionCache();
    const cacheValid = cached !== null && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

    if (cacheValid && cached) {
      // Serve immediately from cache — shuffle options so correct answer position varies
      setState({ bank: shuffleBank(cached.questions), isReady: true, error: false });

      // Background refresh — update cache silently on success (no re-render)
      fetchBank()
        .then((questions) => {
          setQuestionCache({ fetchedAt: Date.now(), questions });
        })
        .catch(() => {
          // Background refresh failed — silently ignore; cache is already serving
        });
      return;
    }

    // Cache miss or stale — fetch and block render on result
    fetchBank()
      .then((questions) => {
        if (questions.length === 0) {
          // API returned empty bank — treat as error to avoid infinite spinner
          setState({ bank: [], isReady: false, error: true });
          return;
        }
        setQuestionCache({ fetchedAt: Date.now(), questions });
        setState({ bank: shuffleBank(questions), isReady: true, error: false });
      })
      .catch(() => {
        // Network error with no cached fallback
        setState({ bank: [], isReady: false, error: true });
      });
  }, []);

  return state;
}
