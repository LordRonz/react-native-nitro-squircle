#pragma once

#include <cstdint>

namespace margelo::nitro::nitrosquircle {

struct InstrumentationSnapshot {
  std::uint64_t geometryCalculations = 0;
  std::uint64_t pathCreations = 0;
  std::uint64_t cacheHits = 0;
  std::uint64_t cacheMisses = 0;
};

class SquircleInstrumentation final {
public:
  [[nodiscard]] static InstrumentationSnapshot snapshot() noexcept;
  static void reset() noexcept;
  static void recordCacheHit() noexcept;
  static void recordCacheMiss() noexcept;
  static void recordGeometryCalculation(std::uint64_t pathCount) noexcept;
};

} // namespace margelo::nitro::nitrosquircle
