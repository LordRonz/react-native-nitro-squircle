#include "SquircleInstrumentation.hpp"

#ifndef NDEBUG
#include <atomic>
#endif

namespace margelo::nitro::nitrosquircle {
namespace {

#ifndef NDEBUG
std::atomic<std::uint64_t> geometryCalculations{0};
std::atomic<std::uint64_t> pathCreations{0};
std::atomic<std::uint64_t> cacheHits{0};
std::atomic<std::uint64_t> cacheMisses{0};
#endif

} // namespace

InstrumentationSnapshot SquircleInstrumentation::snapshot() noexcept {
#ifndef NDEBUG
  return {
      geometryCalculations.load(std::memory_order_relaxed),
      pathCreations.load(std::memory_order_relaxed),
      cacheHits.load(std::memory_order_relaxed),
      cacheMisses.load(std::memory_order_relaxed),
  };
#else
  return {};
#endif
}

void SquircleInstrumentation::reset() noexcept {
#ifndef NDEBUG
  geometryCalculations.store(0, std::memory_order_relaxed);
  pathCreations.store(0, std::memory_order_relaxed);
  cacheHits.store(0, std::memory_order_relaxed);
  cacheMisses.store(0, std::memory_order_relaxed);
#endif
}

void SquircleInstrumentation::recordCacheHit() noexcept {
#ifndef NDEBUG
  cacheHits.fetch_add(1, std::memory_order_relaxed);
#endif
}

void SquircleInstrumentation::recordCacheMiss() noexcept {
#ifndef NDEBUG
  cacheMisses.fetch_add(1, std::memory_order_relaxed);
#endif
}

void SquircleInstrumentation::recordGeometryCalculation(std::uint64_t pathCount) noexcept {
#ifndef NDEBUG
  geometryCalculations.fetch_add(1, std::memory_order_relaxed);
  pathCreations.fetch_add(pathCount, std::memory_order_relaxed);
#else
  (void)pathCount;
#endif
}

} // namespace margelo::nitro::nitrosquircle
