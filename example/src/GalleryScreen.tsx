import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SquircleView } from 'react-native-nitro-squircle'

const smoothingValues = [0, 0.2, 0.4, 0.6, 0.8, 1]

function Section({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export function GalleryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title="Smoothing spectrum">
        <View style={styles.grid}>
          {smoothingValues.map((smoothing) => (
            <View key={smoothing} style={styles.sampleWrap}>
              <SquircleView
                cornerSmoothing={smoothing}
                style={[styles.sample, styles.samplePurple]}
              >
                <Text style={styles.sampleIcon}>✦</Text>
              </SquircleView>
              <Text style={styles.caption}>{smoothing.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Individual corners">
        <SquircleView style={[styles.wideCard, styles.asymmetricCard]}>
          <Text style={styles.cardKicker}>ASYMMETRY</Text>
          <Text style={styles.cardTitle}>Four corners, one path engine.</Text>
        </SquircleView>
      </Section>

      <Section title="Border & shadow">
        <SquircleView style={[styles.wideCard, styles.borderShadowCard]}>
          <Text style={styles.cardKicker}>NATIVE VECTOR</Text>
          <Text style={styles.cardTitle}>Retained paths and layers.</Text>
        </SquircleView>
      </Section>

      <Section title="Overflow & nested content">
        <SquircleView style={styles.clipCard}>
          <View style={[styles.band, styles.bandOne]} />
          <View style={[styles.band, styles.bandTwo]} />
          <View style={styles.clipCopy}>
            <Text style={styles.cardKicker}>SQUIRCLE CLIP</Text>
            <Text style={styles.cardTitle}>Children stay children.</Text>
            <Text style={styles.body}>
              Text, views, images, gestures and layout remain in the normal
              Fabric tree.
            </Text>
          </View>
        </SquircleView>
      </Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 64, gap: 28 },
  section: { gap: 12 },
  sectionTitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sampleWrap: { alignItems: 'center', gap: 7 },
  sample: {
    width: 92,
    height: 92,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  samplePurple: { backgroundColor: '#6366f1' },
  sampleIcon: { color: '#eef2ff', fontSize: 28 },
  caption: {
    color: '#71717a',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    fontWeight: '700',
  },
  wideCard: { minHeight: 142, padding: 22, justifyContent: 'flex-end' },
  asymmetricCard: {
    backgroundColor: '#f97316',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 44,
    borderBottomLeftRadius: 24,
  },
  borderShadowCard: {
    backgroundColor: '#18181b',
    borderColor: '#a5b4fc',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 30,
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardKicker: {
    color: '#fed7aa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.6,
    maxWidth: 280,
  },
  clipCard: {
    height: 220,
    borderRadius: 40,
    backgroundColor: '#27272a',
    overflow: 'hidden',
  },
  band: { position: 'absolute', width: 500, height: 88, left: -60, top: 12 },
  bandOne: { backgroundColor: '#ec4899', transform: [{ rotate: '-8deg' }] },
  bandTwo: {
    backgroundColor: '#8b5cf6',
    top: 92,
    transform: [{ rotate: '7deg' }],
  },
  clipCopy: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  body: {
    color: '#e4e4e7',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 300,
  },
})
