#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

namespace margelo::nitro::nitrosquircle {

struct Point {
  float x = 0;
  float y = 0;

  bool operator==(const Point&) const = default;
};

struct CornerRadii {
  float topLeft = 0;
  float topRight = 0;
  float bottomRight = 0;
  float bottomLeft = 0;

  bool operator==(const CornerRadii&) const = default;
};

struct SquircleGeometry {
  float width = 0;
  float height = 0;
  CornerRadii radii;
  float smoothing = 0;

  bool operator==(const SquircleGeometry&) const = default;
};

enum class PathCommandType : std::uint8_t {
  MoveTo,
  LineTo,
  CubicTo,
  ArcTo,
  Close,
};

struct PathCommand {
  PathCommandType type = PathCommandType::Close;
  Point point1;
  Point point2;
  Point point3;
  float radius = 0;
  float startAngle = 0;
  float endAngle = 0;
  bool clockwise = true;
};

struct SquirclePath {
  static constexpr std::size_t maxCommands = 17;

  std::array<PathCommand, maxCommands> commands{};
  std::size_t count = 0;

  void push(const PathCommand& command);
  bool operator==(const SquirclePath&) const;
};

struct SquirclePaths {
  SquirclePath outer;
  SquirclePath borderCenter;
  SquirclePath inner;
};

[[nodiscard]] SquircleGeometry normalizeGeometry(const SquircleGeometry& geometry) noexcept;
[[nodiscard]] SquircleGeometry insetGeometry(const SquircleGeometry& geometry, float inset) noexcept;
[[nodiscard]] SquirclePath createSquirclePath(const SquircleGeometry& geometry);
[[nodiscard]] SquirclePaths createSquirclePaths(const SquircleGeometry& geometry, float borderWidth);

} // namespace margelo::nitro::nitrosquircle
