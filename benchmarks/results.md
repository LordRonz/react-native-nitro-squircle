# Benchmark results

No reproducible device results have been recorded yet.

| Device    | OS  | RN  | Nitro | Mode    | Views | Scenario | RN View | figma-squircle | fast-squircle | nitro-squircle |
| --------- | --- | --- | ----- | ------- | ----: | -------- | ------: | -------------: | ------------: | -------------: |
| _pending_ |     |     |       | release |       |          |         |                |               |                |

## C++ geometry microbenchmark — 2026-09-12

Apple M2, macOS 26.6.2 (25G83), Apple Clang 21.0.0, arm64,
`-O3 -DNDEBUG -std=c++20`. Baseline: C++ sources at
`fe8135d2ee668872fa6fe17e84208001f8590e70`. After: independent path invalidation
and normalized internal geometry helpers in this working tree.

Both builds used `SquircleBenchmark.cpp`. Each invocation performed one warm-up
and seven 200,000-update trials. Values below are medians of five invocation
medians per build; execution order alternated between builds.

| Scenario                  | Before (ns/update) | After (ns/update) | Time reduction |
| ------------------------- | -----------------: | ----------------: | -------------: |
| Cache hit                 |               12.7 |              13.1 |          -3.1% |
| Uniform resize, no border |              217.1 |             148.6 |          31.6% |
| Uniform resize, border    |              414.5 |             316.2 |          23.7% |
| Mixed resize, border      |              520.2 |             437.1 |          16.0% |
| Border width only         |              408.8 |             179.3 |          56.1% |

These results exclude React, the platform bridges, native path conversion, and
drawing. They do not establish device FPS improvements or compare this library
with the other squircle implementations. Cache hits showed a small increase;
the measured gains are in changed geometry. See the standalone command in
`README.md` to reproduce the measurement.

Validation accompanying this change:

- C++ regression suite, including independent path flags, border removal,
  clamping, empty bounds, recycling, and invalid-input normalization; also passed
  with AddressSanitizer and UndefinedBehaviorSanitizer.
- 300,000 differential updates against the baseline, using seed 42, uniform and
  mixed radii, oversized corners, and changing border widths. Comparison ignored
  degenerate cubic segments shorter than 0.001 coordinate units. Maximum
  coordinate difference was 0.000244; maximum sampled arc-point difference was
  0.000328. Removing repeated floating-point normalization is not bit-identical
  for all oversized inputs.
- iOS library simulator build and isolated UIKit runtime checks for paint-only
  bridge avoidance, retained outer paths, dash styles, resize, hidden/reveal,
  clipping, and recycling.
- Android renderer/bridge Kotlin compilation against React Native 0.86.2 and
  Android API 36, plus JNI C++ compilation checks. No Android device runtime
  validation was available.
- Existing JavaScript tests, TypeScript checks, and lint.
