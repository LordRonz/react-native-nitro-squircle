import React, { forwardRef, type ComponentRef } from 'react'

import { NativeSquircleView } from './SquircleNativeView'
import { resolveSquircleStyle } from './resolveSquircleStyle'
import type { SquircleViewProps } from './types'

type NativeSquircleViewRef = ComponentRef<typeof NativeSquircleView>

export const SquircleView = forwardRef<
  NativeSquircleViewRef,
  SquircleViewProps
>(function SquircleViewComponent(
  { cornerSmoothing = 0.6, style, ...viewProps },
  ref
) {
  const resolved = resolveSquircleStyle(style, cornerSmoothing)

  return (
    <NativeSquircleView
      {...viewProps}
      {...resolved.nativeProps}
      collapsable={false}
      ref={ref}
      style={resolved.hostStyle}
    />
  )
})
