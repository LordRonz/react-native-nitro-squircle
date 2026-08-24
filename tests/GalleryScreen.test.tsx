import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

import { GalleryScreen } from '../example/src/GalleryScreen'

jest.mock('../example/node_modules/react', () => jest.requireActual('react'))
jest.mock('react-native-nitro-squircle', () => ({
  SquircleView: 'SquircleView',
}))

describe('GalleryScreen', () => {
  it('keeps slider movement relative to the fixed track', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<GalleryScreen />)
    })

    const slider = () =>
      renderer!.root.findByProps({ accessibilityLabel: 'Corner radius' })

    act(() => {
      slider().props.onLayout({ nativeEvent: { layout: { width: 300 } } })
    })
    act(() => {
      slider().props.onResponderGrant({
        nativeEvent: { locationX: 150, pageX: 150 },
      })
    })
    act(() => {
      slider().props.onResponderMove({
        nativeEvent: { locationX: 10, pageX: 150 },
      })
    })

    expect(slider().props.accessibilityValue.now).toBe(50)
  })
})
