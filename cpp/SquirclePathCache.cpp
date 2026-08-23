#include "SquirclePathCache.hpp"

#include "SquircleInstrumentation.hpp"

#include <algorithm>
#include <cmath>

namespace margelo::nitro::nitrosquircle {

bool SquirclePathCache::update(const SquircleGeometry& geometry, float borderWidth) {
  const auto normalized = normalizeGeometry(geometry);
  const float safeBorderWidth = std::isfinite(borderWidth)
      ? std::clamp(borderWidth, 0.0f, std::min(normalized.width, normalized.height) / 2)
      : 0;

  if (hasValue_ && geometry_ == normalized && borderWidth_ == safeBorderWidth) {
    SquircleInstrumentation::recordCacheHit();
    return false;
  }

  geometry_ = normalized;
  borderWidth_ = safeBorderWidth;
  paths_ = createSquirclePaths(normalized, safeBorderWidth);
  hasValue_ = true;

  std::uint64_t createdPaths = paths_.outer.count > 0 ? 1 : 0;
  createdPaths += paths_.borderCenter.count > 0 ? 1 : 0;
  createdPaths += paths_.inner.count > 0 ? 1 : 0;
  SquircleInstrumentation::recordCacheMiss();
  SquircleInstrumentation::recordGeometryCalculation(createdPaths);
  return true;
}

void SquirclePathCache::reset() noexcept {
  geometry_ = {};
  borderWidth_ = 0;
  paths_ = {};
  hasValue_ = false;
}

} // namespace margelo::nitro::nitrosquircle
