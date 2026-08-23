#include "HybridSquircleDiagnostics.hpp"

#include "SquircleInstrumentation.hpp"

namespace margelo::nitro::nitrosquircle {

SquircleDebugStats HybridSquircleDiagnostics::getSnapshot() {
  const auto stats = SquircleInstrumentation::snapshot();
  return SquircleDebugStats(
      static_cast<double>(stats.geometryCalculations),
      static_cast<double>(stats.pathCreations),
      static_cast<double>(stats.cacheHits),
      static_cast<double>(stats.cacheMisses));
}

void HybridSquircleDiagnostics::reset() {
  SquircleInstrumentation::reset();
}

} // namespace margelo::nitro::nitrosquircle
