# react-native-nitro-squircle

A native Figma-style squircle View for React Native powered by Nitro Modules.

It keeps the small API of a normal `View`, adds `cornerSmoothing`, and uses one
shared C++ geometry engine with thin Core Animation and Android Canvas renderers.
This project is not affiliated with or endorsed by Figma.

## Installation

```sh
npm install react-native-nitro-squircle react-native-nitro-modules
```

This is a Fabric Hybrid View and requires React Native's New Architecture. The
current implementation uses Nitro/Nitrogen 0.37 and targets React Native 0.78 or
newer. Install pods after adding the package:

```sh
npx pod-install
```

Expo Go cannot load custom native modules. Use a development build and run
`npx expo prebuild` after installation; Expo autolinking discovers the package,
so no manual native project edits are required.

## Usage

```tsx
import { SquircleView } from 'react-native-nitro-squircle'

export function Card() {
  return (
    <SquircleView
      cornerSmoothing={0.6}
      style={{
        width: 200,
        height: 120,
        padding: 20,
        backgroundColor: '#111',
        borderRadius: 32,
      }}
    >
      {children}
    </SquircleView>
  )
}
```

`SquircleViewProps` extends React Native `ViewProps`. `cornerSmoothing` defaults
to `0.6`; native geometry clamps non-finite or out-of-range input safely to
`0...1`.

### Per-corner radii

```tsx
<SquircleView
  cornerSmoothing={0.8}
  style={{
    width: 220,
    height: 140,
    backgroundColor: 'tomato',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 20,
  }}
/>
```

Numeric logical radii such as `borderStartStartRadius` are also resolved using
the current RTL direction.

### Border and shadow

```tsx
<SquircleView
  style={{
    width: 220,
    height: 140,
    borderRadius: 36,
    backgroundColor: '#18181b',
    borderColor: '#a5b4fc',
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: '#6366f1',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  }}
/>
```

Legacy iOS shadow props use the squircle as `shadowPath`. Android elevation uses
the squircle as the native outline.

### Clip children

```tsx
<SquircleView
  style={{ width: 240, height: 160, borderRadius: 40, overflow: 'hidden' }}
>
  <Image source={{ uri }} style={{ width: 280, height: 200 }} />
</SquircleView>
```

Children remain normal Fabric descendants; `overflow: 'hidden'` or `'scroll'`
clips them with the generated squircle path.

## Performance architecture

- Nitro batches native prop setters with `beforeUpdate` / `afterUpdate`.
- One per-view C++ cache compares normalized geometry before doing corner math.
- Outer and border-center paths are generated together in fixed-capacity command
  buffers.
- iOS creates shape and mask layers only when needed, then reuses them with
  retained `CGPath`s.
- Android reuses `Path`, `Paint`, direct buffers, and its outline provider.
- Neither renderer recalculates geometry during draw. Debug counters prove that
  unchanged/background-only updates create no new geometry; release builds
  compile the counters out.

There is no global cache and no dependency on SVG, Skia, or private React Native
view fields. See [the architecture note](docs/architecture.md) for the upstream
comparison and implementation details.

## Benchmarking

The example app compares React Native `View`, `react-native-figma-squircle`,
`react-native-fast-squircle`, and this package at 100, 500, and 1000 views. It
includes initial mount, unchanged rerender, radius, smoothing, resize, and
realistic `FlatList` scenarios.

No performance result is claimed yet. Follow the reproducible
[benchmark protocol](benchmarks/README.md) and record real device results in
[`benchmarks/results.md`](benchmarks/results.md).

```sh
cd example
npm install
npm run ios
```

## Compatibility and limitations

The stable renderer currently supports children, normal layout and View props,
numeric physical/logical radii, static colors, uniform solid/dashed/dotted
borders, squircle clipping, legacy iOS shadows, and Android elevation.

The following are deliberately not painted as squircles yet:

- percentage or animated radius values;
- dynamic platform colors;
- individual non-uniform border widths or colors;
- React Native `outline*` and cross-platform `boxShadow`;
- native `backgroundImage`/gradient styles.

Development builds warn once for unsupported visual styles rather than silently
rendering an incorrect shape. A child image or gradient plus `overflow: 'hidden'`
is the supported background-image composition.

Native source is designed for iOS 13+/visionOS 1+ and Android API 23+ through
Nitro's current toolchain. React Native 0.85.3 is the library development
baseline; the Expo example tracks React Native 0.86.2. Older claimed versions
have not been native-build tested in this repository.

## Development

```sh
npm install
npm run codegen
npm run typecheck
npm run lint-ci
npm test
```

Generated Nitrogen output is committed. Do not edit `nitrogen/generated`
manually.

## Credits

- [`react-native-fast-squircle`](https://github.com/fbeccaceci/react-native-fast-squircle)
  is the primary compatibility and benchmark reference.
- [`figma-squircle`](https://github.com/phamfoo/figma-squircle) documents the
  reverse-engineered corner-smoothing mathematics used by this independent
  implementation.
- [Nitro Modules](https://nitro.margelo.com/) provides the Hybrid View and JSI
  integration.

See [third-party notices](THIRD_PARTY_NOTICES.md) for attribution.

## License

MIT
