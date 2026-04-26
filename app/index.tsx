import { useState, useEffect } from 'react';
import { useProgressStore } from '../src/hooks/useProgressStore';
import ColdOpenStart from '../src/screens/start/ColdOpenStart';
import ReturningStart from '../src/screens/start/ReturningStart';

export default function StartRoute() {
  // Defer localStorage read until after hydration. The static export renders
  // with no localStorage (always ColdOpenStart). If we switch screens during
  // hydration, React sees a tree mismatch and throws error #418. We match the
  // server HTML on first render, then correct after mount.
  const [hydrated, setHydrated] = useState(false);
  const { hasAnyProgress } = useProgressStore();

  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) return <ColdOpenStart />;
  return hasAnyProgress() ? <ReturningStart /> : <ColdOpenStart />;
}
