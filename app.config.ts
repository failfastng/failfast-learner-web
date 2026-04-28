import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FailFast Learner',
  slug: 'failfast-learner-web',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'static',
    manifest: {
      name: 'FailFast Learner',
      short_name: 'FailFast',
      theme_color: '#111111',
      background_color: '#ffffff',
    },
    meta: {
      title: 'FailFast Learner',
      description: 'Practice that counts the effort, not just the answer.',
      'og:title': 'FailFast Learner',
      'og:description': 'Practice that counts the effort, not just the answer.',
      'og:image': 'https://learner.failfastng.com/og-preview.png',
      'og:url': 'https://learner.failfastng.com',
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': 'FailFast Learner',
      'twitter:description': 'Practice that counts the effort, not just the answer.',
      'twitter:image': 'https://learner.failfastng.com/og-preview.png',
    },
  },
  plugins: ['expo-router'],
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.learner.failfastng.com',
  },
});
