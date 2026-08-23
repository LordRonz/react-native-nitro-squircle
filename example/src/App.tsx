import React, { useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { BenchmarkScreen } from './BenchmarkScreen'
import { GalleryScreen } from './GalleryScreen'

type Screen = 'gallery' | 'benchmark'

export default function App() {
  const [screen, setScreen] = useState<Screen>('gallery')

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NITRO MODULES · 0.37</Text>
          <Text style={styles.title}>Squircle Lab</Text>
        </View>
        <View style={styles.tabs}>
          {(['gallery', 'benchmark'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setScreen(item)}
              style={[styles.tab, screen === item && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  screen === item && styles.tabTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {screen === 'gallery' ? <GalleryScreen /> : <BenchmarkScreen />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#fafafa',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#18181b',
  },
  tab: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9 },
  tabActive: { backgroundColor: '#fafafa' },
  tabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  tabTextActive: { color: '#18181b' },
})
