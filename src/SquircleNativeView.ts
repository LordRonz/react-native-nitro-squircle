import { getHostComponent } from 'react-native-nitro-modules'

import SquircleNativeViewConfig from '../nitrogen/generated/shared/json/SquircleNativeViewConfig.json'
import type {
  SquircleNativeViewMethods,
  SquircleNativeViewProps,
} from './specs/SquircleView.nitro'

export const NativeSquircleView = getHostComponent<
  SquircleNativeViewProps,
  SquircleNativeViewMethods
>('SquircleNativeView', () => SquircleNativeViewConfig)
