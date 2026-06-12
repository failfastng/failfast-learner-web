import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { trackPageView } from '../lib/gtag';

export function GaPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
