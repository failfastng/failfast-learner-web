import { Stack } from 'expo-router';
import Head from 'expo-router/head';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="practice/[subject]" options={{ headerShown: false }} />

      <Head>
        <meta property="og:title" content="FailFast Learner" />
        <meta property="og:description" content="Practice that counts the effort, not just the answer." />
        <meta property="og:image" content="https://learner.failfastng.com/og-placeholder.png" />
        <meta property="og:url" content="https://learner.failfastng.com" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="FailFast Learner" />
        <meta property="twitter:description" content="Practice that counts the effort, not just the answer." />
        <meta property="twitter:image" content="https://learner.failfastng.com/og-placeholder.png" />
      </Head>
    </Stack>
  );
}
