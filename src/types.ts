import type { ViewProps } from 'react-native'

export interface SquircleViewProps extends ViewProps {
  /** Figma-style corner smoothing. Native code clamps the value to 0...1. @default 0.6 */
  cornerSmoothing?: number
}
