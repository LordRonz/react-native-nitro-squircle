# Architecture

## Data flow

```text
React / TypeScript style resolution
              │ private primitive Nitro props
              ▼
       Nitrogen Hybrid View
              │ batched beforeUpdate/afterUpdate
              ▼
    per-view shared C++ path cache
              │ generic fixed-capacity commands
       ┌──────┴──────┐
       ▼             ▼
 Core Graphics   Android Path/Canvas
```

The public component accepts `ViewProps`. Its wrapper flattens the style once,
resolves physical and logical corner radii using React Native precedence and
RTL direction, and keeps layout, events, accessibility, transforms, opacity,
z-index, pointer events, and Android elevation on the Fabric host. Values that
the platform renderer owns—background, corner radii, clipping, a uniform border,
and legacy iOS shadow props—are forwarded as primitive Nitro state.

Nitrogen 0.37 generates a Swift/Kotlin Hybrid View spec and Fabric state updater.
Both implementations batch the generated property setters between
`beforeUpdate()` and `afterUpdate()`. Platform UI state is only applied on its UI
thread.

`SquirclePathCache` owns normalized source geometry and the last outer,
border-center, and inner command buffers. Exact comparison is safe here because
it compares normalized source values, not independently recomputed floating
point output. Background-only and identical updates hit the per-view cache and
do not run corner math. There is intentionally no global cache.

The geometry output is a 17-command fixed-capacity value buffer containing move,
line, cubic, circular arc, and close commands. iOS converts changed buffers
directly to retained `CGPath`s in Objective-C++. Android writes changed buffers
through one direct `ByteBuffer` JNI call and decodes them into two retained
`Path` instances. Neither renderer builds paths during drawing.

On iOS, one transparent controller view is installed by the generated Nitro
Fabric component. Three retained `CAShapeLayer`s and one retained mask are
attached to the Fabric wrapper so normal children continue to work. Implicit
Core Animation actions are disabled. On Android, a small `ReactViewManager`
compatibility adapter is necessary because Nitrogen 0.37 currently generates a
`SimpleViewManager<View>`; the custom manager returns a `ReactViewGroup`, keeping
normal child management while reusing Nitrogen's generated state updater.

## Reference baseline

The 1.1.5 release of `react-native-fast-squircle` was inspected before this
implementation:

- iOS integrates deeply with `RCTViewComponentView`, accesses React Native view
  internals at runtime, calculates Swift `UIBezierPath`s during layer
  invalidation, and allocates clipping/mask objects on relevant updates. It
  supports a broad set of native background, border, outline, and shadow styles.
- Android adapts React Native background, border, shadow, and background-image
  drawables, including private fields/reflection where needed. Several drawable
  draw paths request squircle geometry as they render. This preserves more of
  1.1.5's React Native styling surface than the stable-adapter approach here.

This project deliberately trades some style coverage for a smaller compatibility
surface: shared deterministic geometry, stable platform graphics APIs, retained
rendering objects, batched updates, and no dependence on React Native private
ivars or drawable fields. That is an architectural difference, not evidence of
a performance win by itself; the example benchmark exists to measure it.

## Supported rendering surface

- Children, layout, touch/press handling, accessibility, test IDs, `onLayout`,
  opacity, transforms, z-index, and pointer events remain ordinary Fabric View
  behavior.
- Numeric physical and logical corner radii, static background colors, uniform
  borders (`solid`, `dashed`, `dotted`), squircle clipping, legacy iOS shadows,
  and Android elevation outlines are rendered natively.
- Percentage/animated radii, dynamic platform colors, non-uniform border
  widths/colors, `outline*`, cross-platform `boxShadow`, and native background
  images/gradients are not currently painted by the squircle adapter. Development
  builds warn once when these styles would be visually wrong.

Supporting the omitted native drawable features without private React Native
internals is the current compatibility ceiling. Add a narrowly versioned adapter
only when a real application requires one and it can be tested across the stated
React Native range.
