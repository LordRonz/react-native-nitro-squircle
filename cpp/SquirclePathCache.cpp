#include "SquirclePathCache.hpp"

#include "SquircleInstrumentation.hpp"

#include <algorithm>
#include <cmath>

namespace margelo::nitro::nitrosquircle {

std::uint8_t SquirclePathCache::update(const SquircleGeometry& geometry, float borderWidth) {
  const auto normalized = normalizeGeometry(geometry);
  const float safeBorderWidth = std::isfinite(borderWidth)
      ? std::clamp(borderWidth, 0.0f, std::min(normalized.width, normalized.height) / 2)
      : 0;

  const bool updateOuter = !hasValue_ || geometry_ != normalized;
  if (!updateOuter && borderWidth_ == safeBorderWidth) {
    SquircleInstrumentation::recordCacheHit();
    return 0;
  }

  const bool updateBorder = borderWidth_ != safeBorderWidth || (updateOuter && safeBorderWidth > 0);
  std::uint64_t createdPaths = 0;
  if (updateOuter) {
    paths_.outer = detail::createNormalizedSquirclePath(normalized);
    createdPaths += paths_.outer.count > 0 ? 1 : 0;
  }
  if (updateBorder) {
    paths_.borderCenter = detail::createNormalizedBorderPath(normalized, safeBorderWidth);
    createdPaths += paths_.borderCenter.count > 0 ? 1 : 0;
  }
  geometry_ = normalized;
  borderWidth_ = safeBorderWidth;
  hasValue_ = true;

  SquircleInstrumentation::recordCacheMiss();
  SquircleInstrumentation::recordGeometryCalculation(createdPaths);
  return (updateOuter ? outerChanged : 0) | (updateBorder ? borderChanged : 0);
}

void SquirclePathCache::reset() noexcept {
  geometry_ = {};
  borderWidth_ = 0;
  paths_ = {};
  hasValue_ = false;
}

} // namespace margelo::nitro::nitrosquircle
