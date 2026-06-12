type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

export function normalizeGaMeasurementId(raw: string | undefined): string | undefined {
  return raw && raw.trim() ? raw.trim() : undefined;
}

export function getGaMeasurementId(): string | undefined {
  return normalizeGaMeasurementId(process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID);
}

export function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function sendPageView(path: string): void {
  window.gtag!('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function sendEvent(name: string, params?: Record<string, string | number | boolean>): void {
  window.gtag!('event', name, params ?? {});
}

export function trackPageView(path: string): void {
  if (!getGaMeasurementId() || !isGtagAvailable()) return;
  sendPageView(path);
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (!getGaMeasurementId() || !isGtagAvailable()) return;
  sendEvent(name, params);
}
