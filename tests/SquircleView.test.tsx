import React from 'react'
import { StyleSheet } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'

import { SquircleView } from '../src'

jest.mock('../src/SquircleNativeView', () => ({
  NativeSquircleView: 'SquircleNativeView',
}))

describe('SquircleView', () => {
  it('exports a View-compatible component with the documented default', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <SquircleView
          testID="shape"
          style={{ backgroundColor: '#112233', borderRadius: 24 }}
        >
          child
        </SquircleView>
      )
    })

    const native = renderer!.root.findByType('SquircleNativeView')
    expect(native.props.cornerSmoothing).toBe(0.6)
    expect(native.props.topLeftRadius).toBe(24)
    expect(native.props.topRightRadius).toBe(24)
    expect(native.props.bottomRightRadius).toBe(24)
    expect(native.props.bottomLeftRadius).toBe(24)
    expect(native.props.squircleBackgroundColor).not.toBe(0)
    expect(native.props.backgroundColor).toBeUndefined()
    expect(Array.isArray(native.props.style)).toBe(true)
    expect(StyleSheet.flatten(native.props.style).backgroundColor).toBe(
      'transparent'
    )
    expect(native.props.testID).toBe('shape')
    expect(native.props.children).toBe('child')
  })

  it('forwards individual radii and explicit smoothing', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <SquircleView
          cornerSmoothing={1}
          style={{
            borderTopLeftRadius: 1,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 3,
            borderBottomLeftRadius: 4,
          }}
        />
      )
    })

    const native = renderer!.root.findByType('SquircleNativeView')
    expect([
      native.props.topLeftRadius,
      native.props.topRightRadius,
      native.props.bottomRightRadius,
      native.props.bottomLeftRadius,
      native.props.cornerSmoothing,
    ]).toEqual([1, 2, 3, 4, 1])
  })

  it('reuses resolved props when its style inputs are unchanged', () => {
    const style = { backgroundColor: '#112233', borderRadius: 24 }
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<SquircleView style={style} />)
    })

    const firstStyle =
      renderer!.root.findByType('SquircleNativeView').props.style
    act(() => {
      renderer!.update(<SquircleView style={style} />)
    })

    expect(renderer!.root.findByType('SquircleNativeView').props.style).toBe(
      firstStyle
    )
  })
})
