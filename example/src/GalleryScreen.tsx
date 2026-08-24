import React, { useState } from 'react'
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeTouchEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}) {
  const [width, setWidth] = useState(0)
  const progress = (value - min) / (max - min)
  const fillStyle = { width: `${progress * 100}%` as `${number}%` }
  const thumbStyle = { left: width > 0 ? progress * width - 10 : 0 }

  const update = (locationX: number) => {
    const next =
      min + (Math.max(0, Math.min(locationX, width)) / width) * (max - min)
    onChange(Math.round(next / step) * step)
  }

  const handleTouch = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    if (width > 0) update(event.nativeEvent.locationX)
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }

  return (
    <View style={styles.control}>
      <View style={styles.controlHeader}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>{displayValue}</Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'increment') {
            onChange(Math.min(max, value + step))
          } else if (nativeEvent.actionName === 'decrement') {
            onChange(Math.max(min, value - step))
          }
        }}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        style={styles.sliderHitArea}
      >
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, fillStyle]} />
          <View style={[styles.sliderThumb, thumbStyle]} />
        </View>
      </View>
    </View>
  )
}

export function GalleryScreen() {
  const [radius, setRadius] = useState(48)
  const [smoothing, setSmoothing] = useState(0.6)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title="Playground">
        <View style={styles.playground}>
          <SquircleView
            cornerSmoothing={smoothing}
            style={[styles.preview, { borderRadius: radius }]}
          >
            <Text style={styles.previewIcon}>✦</Text>
            <Text style={styles.previewTitle}>Squircle</Text>
          </SquircleView>
          <View style={styles.controls}>
            <Slider
              label="Corner radius"
              value={radius}
              min={0}
              max={100}
              step={1}
              displayValue={`${radius} px`}
              onChange={setRadius}
            />
            <Slider
              label="Corner smoothing"
              value={smoothing}
              min={0}
              max={1}
              step={0.01}
              displayValue={smoothing.toFixed(2)}
              onChange={setSmoothing}
            />
          </View>
        </View>
      </Section>

      <Section title="Smoothing spectrum">
        <View style={styles.grid}>
          {smoothingValues.map((smoothingValue) => (
            <View key={smoothingValue} style={styles.sampleWrap}>
              <SquircleView
                cornerSmoothing={smoothingValue}
                style={[styles.sample, styles.samplePurple]}
              >
                <Text style={styles.sampleIcon}>✦</Text>
              </SquircleView>
              <Text style={styles.caption}>{smoothingValue.toFixed(1)}</Text>
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
  playground: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 20,
    gap: 24,
  },
  preview: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderColor: '#a5b4fc',
    borderWidth: 2,
    shadowColor: '#6366f1',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  previewIcon: { color: '#eef2ff', fontSize: 34 },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  controls: { gap: 16 },
  control: { gap: 7 },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: { color: '#d4d4d8', fontSize: 12, fontWeight: '700' },
  controlValue: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sliderHitArea: { height: 30, justifyContent: 'center' },
  sliderTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3f3f46',
  },
  sliderFill: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#818cf8',
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 3,
    borderColor: '#6366f1',
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
