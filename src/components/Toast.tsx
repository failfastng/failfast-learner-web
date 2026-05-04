import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  message: string;
  action?: { label: string; onPress: () => void };
  durationMs?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
};

export function Toast({
  message,
  action,
  durationMs = 3000,
  fadeInMs = 200,
  fadeOutMs = 300,
}: Props) {
  const [visible, setVisible] = useState(true);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: fadeInMs, useNativeDriver: true }),
      Animated.delay(durationMs),
      Animated.timing(opacity, { toValue: 0, duration: fadeOutMs, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Pressable onPress={action.onPress} accessibilityRole="button">
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  message: { color: '#fff', fontSize: 14, flex: 1 },
  actionText: { color: '#6ee7b7', fontSize: 14, fontWeight: '600', marginLeft: 12 },
});
