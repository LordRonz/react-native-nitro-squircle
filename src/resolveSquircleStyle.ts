import {
  I18nManager,
  Platform,
  processColor,
  StyleSheet,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import type {
  SquircleBorderStyle,
  SquircleNativeViewProps,
} from './specs/SquircleView.nitro'

export interface ResolvedSquircleStyle {
  hostStyle: ViewStyle
  nativeProps: SquircleNativeViewProps
}

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: unknown
  experimental_backgroundImage?: unknown
}

const warnedFeatures = new Set<string>()

function warnUnsupported(feature: string, message: string): void {
  if (__DEV__ && !warnedFeatures.has(feature)) {
    warnedFeatures.add(feature)
    console.warn(`[react-native-nitro-squircle] ${message}`)
  }
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function radius(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Math.max(finiteNumber(value), 0)
  }
  if (value != null) {
    warnUnsupported(
      'percentage-radius',
      'Percentage border radii are not supported yet; use point values.'
    )
  }
  return undefined
}

function nativeColor(
  value: unknown,
  fallback: number,
  feature: string
): number {
  if (value == null) {
    return fallback
  }
  const processed = processColor(value as ColorValue)
  if (typeof processed === 'number') {
    return processed
  }
  warnUnsupported(
    feature,
    'Dynamic/platform colors are not supported for squircle-painted styles yet.'
  )
  return fallback
}

function resolveRadii(style: ViewStyle): [number, number, number, number] {
  const all = radius(style.borderRadius) ?? 0
  const logicalTopStart =
    radius(style.borderTopStartRadius) ?? radius(style.borderStartStartRadius)
  const logicalTopEnd =
    radius(style.borderTopEndRadius) ?? radius(style.borderStartEndRadius)
  const logicalBottomStart =
    radius(style.borderBottomStartRadius) ?? radius(style.borderEndStartRadius)
  const logicalBottomEnd =
    radius(style.borderBottomEndRadius) ?? radius(style.borderEndEndRadius)

  const topLeading = I18nManager.isRTL ? logicalTopEnd : logicalTopStart
  const topTrailing = I18nManager.isRTL ? logicalTopStart : logicalTopEnd
  const bottomLeading = I18nManager.isRTL
    ? logicalBottomEnd
    : logicalBottomStart
  const bottomTrailing = I18nManager.isRTL
    ? logicalBottomStart
    : logicalBottomEnd

  return [
    radius(style.borderTopLeftRadius) ?? topLeading ?? all,
    radius(style.borderTopRightRadius) ?? topTrailing ?? all,
    radius(style.borderBottomRightRadius) ?? bottomTrailing ?? all,
    radius(style.borderBottomLeftRadius) ?? bottomLeading ?? all,
  ]
}

function resolveBorderWidth(style: ViewStyle): number {
  const all = Math.max(finiteNumber(style.borderWidth), 0)
  const start = Math.max(finiteNumber(style.borderStartWidth, all), 0)
  const end = Math.max(finiteNumber(style.borderEndWidth, all), 0)
  const left = Math.max(
    finiteNumber(style.borderLeftWidth, I18nManager.isRTL ? end : start),
    0
  )
  const right = Math.max(
    finiteNumber(style.borderRightWidth, I18nManager.isRTL ? start : end),
    0
  )
  const top = Math.max(finiteNumber(style.borderTopWidth, all), 0)
  const bottom = Math.max(finiteNumber(style.borderBottomWidth, all), 0)

  if (left !== right || right !== top || top !== bottom) {
    warnUnsupported(
      'individual-border-widths',
      'Individual border widths are not rendered yet; the layout widths remain active, but the squircle border is omitted.'
    )
    return 0
  }
  return left
}

function resolveBorderColor(style: ViewStyle): number {
  const all = style.borderColor
  const start = style.borderStartColor ?? all
  const end = style.borderEndColor ?? all
  const colors = [
    style.borderLeftColor ?? (I18nManager.isRTL ? end : start),
    style.borderTopColor ?? all,
    style.borderRightColor ?? (I18nManager.isRTL ? start : end),
    style.borderBottomColor ?? all,
  ].map((value) => nativeColor(value, 0, 'dynamic-border-color'))

  if (!colors.every((color) => color === colors[0])) {
    warnUnsupported(
      'individual-border-colors',
      'Individual border colors are not rendered yet; use borderColor for a uniform squircle border.'
    )
    return 0
  }
  return colors[0] ?? 0
}

function makeHostStyle(style: ExtendedViewStyle): ViewStyle {
  const hostStyle: ExtendedViewStyle = {
    ...style,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderBottomColor: 'transparent',
    borderEndColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStartColor: 'transparent',
    borderTopColor: 'transparent',
    borderRadius: 0,
    borderBottomEndRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomStartRadius: 0,
    borderEndEndRadius: 0,
    borderEndStartRadius: 0,
    borderStartEndRadius: 0,
    borderStartStartRadius: 0,
    borderTopEndRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopStartRadius: 0,
    overflow: 'visible',
    shadowColor: Platform.OS === 'ios' ? 'transparent' : style.shadowColor,
    shadowOffset: Platform.OS === 'ios' ? undefined : style.shadowOffset,
    shadowOpacity: Platform.OS === 'ios' ? 0 : style.shadowOpacity,
    shadowRadius: Platform.OS === 'ios' ? 0 : style.shadowRadius,
    outlineWidth: 0,
    boxShadow: undefined,
    backgroundImage: undefined,
    experimental_backgroundImage: undefined,
  }

  return hostStyle
}

export function resolveSquircleStyle(
  input: StyleProp<ViewStyle>,
  cornerSmoothing: number
): ResolvedSquircleStyle {
  const style: ExtendedViewStyle = StyleSheet.flatten(input) ?? {}
  const [topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius] =
    resolveRadii(style)
  const borderWidth = resolveBorderWidth(style)

  if (finiteNumber(style.outlineWidth) > 0) {
    warnUnsupported(
      'outline',
      'React Native outline styles are not supported by the current Nitro View adapter.'
    )
  }
  if (style.boxShadow != null) {
    warnUnsupported(
      'box-shadow',
      'The cross-platform boxShadow style is not supported yet; legacy iOS shadow props and Android elevation are supported.'
    )
  }
  if (
    style.backgroundImage != null ||
    style.experimental_backgroundImage != null
  ) {
    warnUnsupported(
      'background-image',
      'Native background images and gradients are not supported yet; render a child and use overflow: hidden.'
    )
  }

  const shadowOffset = style.shadowOffset ?? { width: 0, height: 0 }
  const borderStyle = (style.borderStyle ?? 'solid') as SquircleBorderStyle

  return {
    hostStyle: makeHostStyle(style),
    nativeProps: {
      cornerSmoothing: finiteNumber(cornerSmoothing, 0.6),
      squircleBackgroundColor: nativeColor(
        style.backgroundColor,
        0,
        'dynamic-background-color'
      ),
      squircleBorderColor: resolveBorderColor(style),
      squircleBorderWidth: borderWidth,
      squircleBorderStyle: borderStyle,
      topLeftRadius,
      topRightRadius,
      bottomRightRadius,
      bottomLeftRadius,
      overflowHidden:
        style.overflow === 'hidden' || style.overflow === 'scroll',
      squircleShadowColor: nativeColor(
        style.shadowColor,
        0xff000000,
        'dynamic-shadow-color'
      ),
      squircleShadowOpacity:
        Platform.OS === 'ios'
          ? Math.max(finiteNumber(style.shadowOpacity), 0)
          : 0,
      squircleShadowRadius:
        Platform.OS === 'ios'
          ? Math.max(finiteNumber(style.shadowRadius), 0)
          : 0,
      shadowOffsetX: finiteNumber(shadowOffset.width),
      shadowOffsetY: finiteNumber(shadowOffset.height),
    },
  }
}
