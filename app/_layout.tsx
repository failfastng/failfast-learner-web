import { Stack } from 'expo-router';
import { GaPageViewTracker } from '../src/components/GaPageViewTracker';

export default function RootLayout() {
  return (
    <>
      <GaPageViewTracker />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="practice/[subject]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
