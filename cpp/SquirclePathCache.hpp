#pragma once

#include "SquircleGeometry.hpp"

namespace margelo::nitro::nitrosquircle {

class SquirclePathCache final {
public:
  static constexpr std::uint8_t outerChanged = 1;
  static constexpr std::uint8_t borderChanged = 2;

  // Returns a bit mask of paths that need updating, including paths cleared to empty.
  [[nodiscard]] std::uint8_t update(const SquircleGeometry& geometry, float borderWidth);
  void reset() noexcept;

  [[nodiscard]] const SquircleGeometry& geometry() const noexcept { return geometry_; }
  [[nodiscard]] float borderWidth() const noexcept { return borderWidth_; }
  [[nodiscard]] const SquirclePaths& paths() const noexcept { return paths_; }

private:
  SquircleGeometry geometry_{};
  float borderWidth_ = 0;
  SquirclePaths paths_{};
  bool hasValue_ = false;
};

} // namespace margelo::nitro::nitrosquircle
