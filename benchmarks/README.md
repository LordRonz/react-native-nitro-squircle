# Benchmark protocol

The example app contains the executable benchmark screen. It compares a normal
React Native `View`, `react-native-figma-squircle` 0.4.0,
`react-native-fast-squircle` 1.1.5, and this package with identical dimensions,
colors, radii, borders, and children.

`react-native-figma-squircle` is excluded from the resize scenario because 0.4.0
measures its backing rectangle only on mount.

Run a native release build on one physical device, disable remote debugging, and
record the device, OS, React Native version, Nitro version, build mode, view
count, and scenario. Repeat each case at least five times after one warm-up and
report the median rather than the best run.

Scenarios:

1. Initial mount at 100, 500, and 1000 directly mounted views.
2. Unchanged parent rerender with 500 or 1000 views.
3. Radius updates over 8–48 points.
4. Smoothing updates over 0–1.
5. Width/height updates over a fixed range.
6. A virtualized `FlatList` of realistic cards.

The on-screen duration is a JavaScript-to-next-frame observation, not isolated UI
thread time. Capture JS/UI frame timing and memory with the React Native
performance monitor plus Instruments on iOS or Perfetto/Android Studio on
Android. Debug builds also display C++ geometry calculations, path creations,
cache hits, and cache misses for this package. Release instrumentation returns
zero and has no atomic-counter overhead.

No benchmark results are checked into this repository yet. Populate
`benchmarks/results.md` only with reproducible measurements from the protocol
above, including cases where the reference implementation wins.
