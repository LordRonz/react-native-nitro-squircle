import type { HybridObject } from 'react-native-nitro-modules'

export interface SquircleDebugStats {
  geometryCalculations: number
  pathCreations: number
  cacheHits: number
  cacheMisses: number
}

export interface SquircleDiagnostics extends HybridObject<{
  ios: 'c++'
  android: 'c++'
}> {
  getSnapshot(): SquircleDebugStats
  reset(): void
}
