import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'

export type SquircleBorderStyle = 'solid' | 'dashed' | 'dotted'

export interface SquircleNativeViewProps extends HybridViewProps {
  cornerSmoothing: number
  squircleBackgroundColor: number
  squircleBorderColor: number
  squircleBorderWidth: number
  squircleBorderStyle: SquircleBorderStyle
  topLeftRadius: number
  topRightRadius: number
  bottomRightRadius: number
  bottomLeftRadius: number
  overflowHidden: boolean
  squircleShadowColor: number
  squircleShadowOpacity: number
  squircleShadowRadius: number
  shadowOffsetX: number
  shadowOffsetY: number
}

export interface SquircleNativeViewMethods extends HybridViewMethods {}

export type SquircleNativeView = HybridView<
  SquircleNativeViewProps,
  SquircleNativeViewMethods
>
