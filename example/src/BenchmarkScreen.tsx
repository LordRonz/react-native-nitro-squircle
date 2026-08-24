import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import FastSquircleView from 'react-native-fast-squircle'
import { SquircleView as FigmaSquircleView } from 'react-native-figma-squircle'
import { SquircleView } from 'react-native-nitro-squircle'
import { getSquircleDiagnostics } from '../../src/diagnostics'

type Renderer =
  'RN View' | 'figma-squircle' | 'fast-squircle' | 'nitro-squircle'
type Scenario =
  'mount' | 'no-op' | 'radius' | 'smoothing' | 'resize' | 'FlatList'
type Stats = ReturnType<
  ReturnType<typeof getSquircleDiagnostics>['getSnapshot']
>

const renderers: Renderer[] = [
  'RN View',
  'figma-squircle',
  'fast-squircle',
  'nitro-squircle',
]
const scenarios: Scenario[] = [
  'mount',
  'no-op',
  'radius',
  'smoothing',
  'resize',
  'FlatList',
]
const figmaScenarios = scenarios.filter((scenario) => scenario !== 'resize')
const counts = [100, 500, 1000]

const Item = memo(function BenchmarkItem({
  renderer,
  scenario,
  phase,
}: {
  renderer: Renderer
  scenario: Scenario
  phase: number
}) {
  const radius = scenario === 'radius' ? 8 + (phase % 40) : 24
  const smoothing = scenario === 'smoothing' ? (phase % 100) / 100 : 0.6
  const sizeOffset = scenario === 'resize' ? phase % 12 : 0
  const layoutStyle = {
    width: 64 + sizeOffset,
    height: 64 + sizeOffset,
    alignItems: 'center',
    justifyContent: 'center',
  } as const
  const style = {
    ...layoutStyle,
    borderRadius: radius,
    backgroundColor: '#4f46e5',
    borderColor: '#c4b5fd',
    borderWidth: 1,
  } as const
  const child = <Text style={styles.itemText}>•</Text>
  if (renderer === 'figma-squircle') {
    return (
      <FigmaSquircleView
        squircleParams={{
          cornerRadius: radius,
          cornerSmoothing: smoothing,
          fillColor: '#4f46e5',
          strokeColor: '#c4b5fd',
          strokeWidth: 1,
        }}
        style={layoutStyle}
      >
        {child}
      </FigmaSquircleView>
    )
  }
  if (renderer === 'fast-squircle') {
    return (
      <FastSquircleView cornerSmoothing={smoothing} style={style}>
        {child}
      </FastSquircleView>
    )
  }
  if (renderer === 'nitro-squircle') {
    return (
      <SquircleView cornerSmoothing={smoothing} style={style}>
        {child}
      </SquircleView>
    )
  }
  return <View style={style}>{child}</View>
})

function MountedGrid({
  renderer,
  scenario,
  count,
  phase,
  onMounted,
}: {
  renderer: Renderer
  scenario: Scenario
  count: number
  phase: number
  onMounted: () => void
}) {
  const onMountedRef = useRef(onMounted)
  useLayoutEffect(() => onMountedRef.current(), [])
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, index) => (
        <Item
          key={index}
          renderer={renderer}
          scenario={scenario}
          phase={phase}
        />
      ))}
    </View>
  )
}

export function BenchmarkScreen() {
  const [renderer, setRenderer] = useState<Renderer>('nitro-squircle')
  const [scenario, setScenario] = useState<Scenario>('mount')
  const [count, setCount] = useState(100)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [duration, setDuration] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const startedAt = useRef(0)

  useEffect(() => {
    if (!running || scenario === 'mount' || scenario === 'FlatList') return
    let frame = 0
    const tick = () => {
      setPhase((value) => value + 1)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, scenario])

  const start = () => {
    const diagnostics = getSquircleDiagnostics()
    diagnostics.reset()
    setStats(null)
    setDuration(null)
    setRunning(false)
    setPhase((value) => value + 1)
    startedAt.current = performance.now()
    requestAnimationFrame(() => setRunning(true))
  }

  const mounted = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDuration(performance.now() - startedAt.current)
        setStats(getSquircleDiagnostics().getSnapshot())
        if (scenario === 'mount') setRunning(false)
      })
    )
  }

  const controls = (
    <>
      <Text style={styles.note}>
        Use release device builds for timing and debug builds for native
        counters. The timer observes JS-to-next-frame latency; use Instruments
        or Perfetto for UI-thread and memory data.
      </Text>
      <Picker
        title="Renderer"
        values={renderers}
        value={renderer}
        onChange={(value) => {
          setRenderer(value)
          if (value === 'figma-squircle' && scenario === 'resize') {
            setScenario('mount')
          }
        }}
      />
      <Picker
        title="Scenario"
        values={renderer === 'figma-squircle' ? figmaScenarios : scenarios}
        value={scenario}
        onChange={setScenario}
      />
      <Picker title="Views" values={counts} value={count} onChange={setCount} />
      <Pressable
        style={styles.runButton}
        onPress={running ? () => setRunning(false) : start}
      >
        <Text style={styles.runText}>
          {running ? 'Stop run' : 'Start measured run'}
        </Text>
      </Pressable>
      <View style={styles.readout}>
        <Metric
          label="Observed mount"
          value={duration == null ? '—' : `${duration.toFixed(1)} ms`}
        />
        <Metric
          label="Geometry calculations"
          value={stats?.geometryCalculations ?? '—'}
        />
        <Metric label="Path creations" value={stats?.pathCreations ?? '—'} />
        <Metric
          label="Cache hits / misses"
          value={stats ? `${stats.cacheHits} / ${stats.cacheMisses}` : '—'}
        />
      </View>
    </>
  )

  if (running && scenario === 'FlatList') {
    return (
      <FlatList
        data={Array.from({ length: count }, (_, index) => index)}
        keyExtractor={(item) => String(item)}
        ListHeaderComponent={controls}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <Item
              renderer={renderer}
              scenario={scenario}
              phase={item + phase}
            />
            <View>
              <Text style={styles.rowTitle}>Card {item + 1}</Text>
              <Text style={styles.rowBody}>
                Virtualized content and native clipping
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.content}
        style={styles.list}
        onLayout={mounted}
      />
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {controls}
      {running && (
        <MountedGrid
          renderer={renderer}
          scenario={scenario}
          count={count}
          phase={scenario === 'no-op' ? 0 : phase}
          onMounted={mounted}
        />
      )}
    </ScrollView>
  )
}

function Picker<T extends string | number>({
  title,
  values,
  value,
  onChange,
}: {
  title: string
  values: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.control}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.options}>
        {values.map((item) => (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.option, value === item && styles.optionActive]}
          >
            <Text
              style={[
                styles.optionText,
                value === item && styles.optionTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  note: { color: '#a1a1aa', fontSize: 12, lineHeight: 17 },
  control: { gap: 8 },
  label: { color: '#d4d4d8', fontSize: 12, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: {
    backgroundColor: '#18181b',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionActive: { backgroundColor: '#4f46e5' },
  optionText: { color: '#71717a', fontSize: 11, fontWeight: '700' },
  optionTextActive: { color: '#fff' },
  runButton: {
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  runText: { color: '#09090b', fontWeight: '900' },
  readout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metric: {
    backgroundColor: '#18181b',
    padding: 13,
    width: '49.8%',
    minHeight: 72,
  },
  metricLabel: { color: '#71717a', fontSize: 10, fontWeight: '700' },
  metricValue: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  list: { flex: 1, backgroundColor: '#111113' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10 },
  rowTitle: { color: '#fafafa', fontWeight: '800' },
  rowBody: { color: '#71717a', fontSize: 11, marginTop: 3 },
})
