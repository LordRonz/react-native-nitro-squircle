import type { ComponentProps } from 'react'

import { SquircleView, type SquircleViewProps } from '../src'

const props: SquircleViewProps = {
  accessible: true,
  cornerSmoothing: 0.6,
  pointerEvents: 'box-none',
  style: { borderRadius: 24 },
}

const componentProps: ComponentProps<typeof SquircleView> = props

export { componentProps }
