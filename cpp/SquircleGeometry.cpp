#include "SquircleGeometry.hpp"

#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace margelo::nitro::nitrosquircle {
namespace {

constexpr float epsilon = 0.000001f;

struct CornerPathParams {
  float radius = 0;
  float a = 0;
  float b = 0;
  float c = 0;
  float d = 0;
  float p = 0;
  float arcSectionLength = 0;
};

float finiteOrZero(float value) noexcept {
  return std::isfinite(value) ? std::max(value, 0.0f) : 0.0f;
}

float radians(float degrees) noexcept {
  return degrees * 0.01745329251994329577f;
}

float scaleForPair(float available, float first, float second) noexcept {
  const float total = first + second;
  return total > available && total > 0 ? available / total : 1;
}

std::array<float, 4> cornerBudgets(const SquircleGeometry& geometry) noexcept {
  const std::array<float, 4> radii = {
      geometry.radii.topLeft,
      geometry.radii.topRight,
      geometry.radii.bottomRight,
      geometry.radii.bottomLeft,
  };
  std::array<float, 4> budgets = {-1, -1, -1, -1};
  std::array<std::size_t, 4> order = {0, 1, 2, 3};
  std::stable_sort(order.begin(), order.end(), [&](std::size_t first, std::size_t second) {
    return radii[first] > radii[second];
  });

  constexpr std::array<std::array<std::size_t, 2>, 4> adjacentCorners = {{{1, 3}, {0, 2}, {3, 1}, {2, 0}}};
  for (std::size_t corner : order) {
    float budget = std::numeric_limits<float>::max();
    for (std::size_t side = 0; side < 2; ++side) {
      const std::size_t adjacent = adjacentCorners[corner][side];
      const float sideLength = side == 0 ? geometry.width : geometry.height;

      float available = 0;
      if (budgets[adjacent] >= 0) {
        available = sideLength - budgets[adjacent];
      } else {
        const float sum = radii[corner] + radii[adjacent];
        available = sum > 0 ? radii[corner] / sum * sideLength : 0;
      }
      budget = std::min(budget, std::max(available, 0.0f));
    }
    budgets[corner] = budget;
  }
  return budgets;
}

CornerPathParams cornerPathParams(float radius, float smoothing, float budget) noexcept {
  if (radius <= 0 || budget <= 0) {
    return {};
  }

  const float maximumSmoothing = std::max(budget / radius - 1, 0.0f);
  const float effectiveSmoothing = std::min(smoothing, maximumSmoothing);
  const float p = std::min((1 + smoothing) * radius, budget);
  const float arcMeasure = 90 * (1 - effectiveSmoothing);
  const float arcSectionLength = std::sin(radians(arcMeasure / 2)) * radius * std::sqrt(2.0f);
  const float angleAlpha = (90 - arcMeasure) / 2;
  const float p3ToP4Distance = radius * std::tan(radians(angleAlpha / 2));
  const float angleBeta = 45 * effectiveSmoothing;
  const float c = p3ToP4Distance * std::cos(radians(angleBeta));
  const float d = c * std::tan(radians(angleBeta));
  const float b = std::max((p - arcSectionLength - c - d) / 3, 0.0f);

  return {
      .radius = radius,
      .a = 2 * b,
      .b = b,
      .c = c,
      .d = d,
      .p = p,
      .arcSectionLength = arcSectionLength,
  };
}

PathCommand moveTo(float x, float y) noexcept {
  return {.type = PathCommandType::MoveTo, .point1 = {x, y}};
}

PathCommand lineTo(float x, float y) noexcept {
  return {.type = PathCommandType::LineTo, .point1 = {x, y}};
}

PathCommand cubicTo(Point control1, Point control2, Point destination) noexcept {
  return {
      .type = PathCommandType::CubicTo,
      .point1 = control1,
      .point2 = control2,
      .point3 = destination,
  };
}

PathCommand arcTo(Point center, float radius, Point start, Point end) noexcept {
  return {
      .type = PathCommandType::ArcTo,
      .point1 = center,
      .radius = radius,
      .startAngle = std::atan2(start.y - center.y, start.x - center.x),
      .endAngle = std::atan2(end.y - center.y, end.x - center.x),
      .clockwise = true,
  };
}

bool hasCurve(const CornerPathParams& params) noexcept {
  return params.a > epsilon || params.b > epsilon || params.c > epsilon || params.d > epsilon;
}

void appendTopRight(SquirclePath& path, float width, const CornerPathParams& params) {
  if (params.radius <= 0) {
    path.push(lineTo(width, 0));
    return;
  }

  const Point start{width - params.p, 0};
  const Point curveEnd{start.x + params.a + params.b + params.c, params.d};
  if (hasCurve(params)) {
    path.push(cubicTo({start.x + params.a, 0}, {start.x + params.a + params.b, 0}, curveEnd));
  }

  const Point arcEnd{curveEnd.x + params.arcSectionLength, curveEnd.y + params.arcSectionLength};
  if (params.arcSectionLength > epsilon) {
    path.push(arcTo({width - params.radius, params.radius}, params.radius, curveEnd, arcEnd));
  }

  if (hasCurve(params)) {
    path.push(cubicTo({arcEnd.x + params.d, arcEnd.y + params.c},
                      {arcEnd.x + params.d, arcEnd.y + params.b + params.c},
                      {width, params.p}));
  }
}

void appendBottomRight(SquirclePath& path, float width, float height, const CornerPathParams& params) {
  if (params.radius <= 0) {
    path.push(lineTo(width, height));
    return;
  }

  const Point start{width, height - params.p};
  const Point curveEnd{start.x - params.d, start.y + params.a + params.b + params.c};
  if (hasCurve(params)) {
    path.push(cubicTo({start.x, start.y + params.a}, {start.x, start.y + params.a + params.b}, curveEnd));
  }

  const Point arcEnd{curveEnd.x - params.arcSectionLength, curveEnd.y + params.arcSectionLength};
  if (params.arcSectionLength > epsilon) {
    path.push(arcTo({width - params.radius, height - params.radius}, params.radius, curveEnd, arcEnd));
  }

  if (hasCurve(params)) {
    path.push(cubicTo({arcEnd.x - params.c, arcEnd.y + params.d},
                      {arcEnd.x - params.b - params.c, arcEnd.y + params.d},
                      {width - params.p, height}));
  }
}

void appendBottomLeft(SquirclePath& path, float height, const CornerPathParams& params) {
  if (params.radius <= 0) {
    path.push(lineTo(0, height));
    return;
  }

  const Point start{params.p, height};
  const Point curveEnd{start.x - params.a - params.b - params.c, start.y - params.d};
  if (hasCurve(params)) {
    path.push(cubicTo({start.x - params.a, start.y}, {start.x - params.a - params.b, start.y}, curveEnd));
  }

  const Point arcEnd{curveEnd.x - params.arcSectionLength, curveEnd.y - params.arcSectionLength};
  if (params.arcSectionLength > epsilon) {
    path.push(arcTo({params.radius, height - params.radius}, params.radius, curveEnd, arcEnd));
  }

  if (hasCurve(params)) {
    path.push(cubicTo({arcEnd.x - params.d, arcEnd.y - params.c},
                      {arcEnd.x - params.d, arcEnd.y - params.b - params.c},
                      {0, height - params.p}));
  }
}

void appendTopLeft(SquirclePath& path, const CornerPathParams& params) {
  if (params.radius <= 0) {
    path.push(lineTo(0, 0));
    return;
  }

  const Point start{0, params.p};
  const Point curveEnd{params.d, start.y - params.a - params.b - params.c};
  if (hasCurve(params)) {
    path.push(cubicTo({0, start.y - params.a}, {0, start.y - params.a - params.b}, curveEnd));
  }

  const Point arcEnd{curveEnd.x + params.arcSectionLength, curveEnd.y - params.arcSectionLength};
  if (params.arcSectionLength > epsilon) {
    path.push(arcTo({params.radius, params.radius}, params.radius, curveEnd, arcEnd));
  }

  if (hasCurve(params)) {
    path.push(cubicTo({arcEnd.x + params.c, arcEnd.y - params.d},
                      {arcEnd.x + params.b + params.c, arcEnd.y - params.d},
                      {params.p, 0}));
  }
}

void translate(SquirclePath& path, float offset) noexcept {
  for (std::size_t index = 0; index < path.count; ++index) {
    auto& command = path.commands[index];
    if (command.type == PathCommandType::Close) {
      continue;
    }
    command.point1.x += offset;
    command.point1.y += offset;
    if (command.type == PathCommandType::CubicTo) {
      command.point2.x += offset;
      command.point2.y += offset;
      command.point3.x += offset;
      command.point3.y += offset;
    }
  }
}

} // namespace

void SquirclePath::push(const PathCommand& command) {
  if (count >= commands.size()) {
    throw std::length_error("SquirclePath command capacity exceeded");
  }
  commands[count++] = command;
}

bool SquirclePath::operator==(const SquirclePath& other) const {
  if (count != other.count) {
    return false;
  }
  for (std::size_t index = 0; index < count; ++index) {
    const auto& first = commands[index];
    const auto& second = other.commands[index];
    if (first.type != second.type || first.point1 != second.point1 || first.point2 != second.point2 ||
        first.point3 != second.point3 || first.radius != second.radius || first.startAngle != second.startAngle ||
        first.endAngle != second.endAngle || first.clockwise != second.clockwise) {
      return false;
    }
  }
  return true;
}

SquircleGeometry normalizeGeometry(const SquircleGeometry& geometry) noexcept {
  SquircleGeometry normalized{
      .width = finiteOrZero(geometry.width),
      .height = finiteOrZero(geometry.height),
      .radii = {
          finiteOrZero(geometry.radii.topLeft),
          finiteOrZero(geometry.radii.topRight),
          finiteOrZero(geometry.radii.bottomRight),
          finiteOrZero(geometry.radii.bottomLeft),
      },
      .smoothing = std::isfinite(geometry.smoothing) ? std::clamp(geometry.smoothing, 0.0f, 1.0f) : 0,
  };

  if (normalized.width <= 0 || normalized.height <= 0) {
    normalized.radii = {};
    return normalized;
  }

  const float scale = std::min({
      1.0f,
      scaleForPair(normalized.width, normalized.radii.topLeft, normalized.radii.topRight),
      scaleForPair(normalized.width, normalized.radii.bottomLeft, normalized.radii.bottomRight),
      scaleForPair(normalized.height, normalized.radii.topLeft, normalized.radii.bottomLeft),
      scaleForPair(normalized.height, normalized.radii.topRight, normalized.radii.bottomRight),
  });

  normalized.radii.topLeft *= scale;
  normalized.radii.topRight *= scale;
  normalized.radii.bottomRight *= scale;
  normalized.radii.bottomLeft *= scale;
  return normalized;
}

SquircleGeometry insetGeometry(const SquircleGeometry& geometry, float inset) noexcept {
  const auto outer = normalizeGeometry(geometry);
  const float safeInset = std::clamp(finiteOrZero(inset), 0.0f, std::min(outer.width, outer.height) / 2);
  return normalizeGeometry({
      .width = std::max(outer.width - 2 * safeInset, 0.0f),
      .height = std::max(outer.height - 2 * safeInset, 0.0f),
      .radii = {
          std::max(outer.radii.topLeft - safeInset, 0.0f),
          std::max(outer.radii.topRight - safeInset, 0.0f),
          std::max(outer.radii.bottomRight - safeInset, 0.0f),
          std::max(outer.radii.bottomLeft - safeInset, 0.0f),
      },
      .smoothing = outer.smoothing,
  });
}

SquirclePath createSquirclePath(const SquircleGeometry& sourceGeometry) {
  const auto geometry = normalizeGeometry(sourceGeometry);
  SquirclePath path;
  if (geometry.width <= 0 || geometry.height <= 0) {
    return path;
  }

  if (geometry.radii == CornerRadii{}) {
    path.push(moveTo(0, 0));
    path.push(lineTo(geometry.width, 0));
    path.push(lineTo(geometry.width, geometry.height));
    path.push(lineTo(0, geometry.height));
    path.push({.type = PathCommandType::Close});
    return path;
  }

  std::array<float, 4> budgets{};
  if (geometry.radii.topLeft == geometry.radii.topRight &&
      geometry.radii.topRight == geometry.radii.bottomRight &&
      geometry.radii.bottomRight == geometry.radii.bottomLeft) {
    budgets.fill(std::min(geometry.width, geometry.height) / 2);
  } else {
    budgets = cornerBudgets(geometry);
  }

  const auto topLeft = cornerPathParams(geometry.radii.topLeft, geometry.smoothing, budgets[0]);
  const auto topRight = cornerPathParams(geometry.radii.topRight, geometry.smoothing, budgets[1]);
  const auto bottomRight = cornerPathParams(geometry.radii.bottomRight, geometry.smoothing, budgets[2]);
  const auto bottomLeft = cornerPathParams(geometry.radii.bottomLeft, geometry.smoothing, budgets[3]);

  path.push(moveTo(geometry.width - topRight.p, 0));
  appendTopRight(path, geometry.width, topRight);
  path.push(lineTo(geometry.width, geometry.height - bottomRight.p));
  appendBottomRight(path, geometry.width, geometry.height, bottomRight);
  path.push(lineTo(bottomLeft.p, geometry.height));
  appendBottomLeft(path, geometry.height, bottomLeft);
  path.push(lineTo(0, topLeft.p));
  appendTopLeft(path, topLeft);
  path.push({.type = PathCommandType::Close});
  return path;
}

SquirclePaths createSquirclePaths(const SquircleGeometry& geometry, float borderWidth) {
  const auto normalized = normalizeGeometry(geometry);
  SquirclePaths paths{.outer = createSquirclePath(normalized)};
  const float safeBorderWidth = std::clamp(finiteOrZero(borderWidth), 0.0f, std::min(normalized.width, normalized.height) / 2);
  if (safeBorderWidth <= 0) {
    return paths;
  }

  paths.borderCenter = createSquirclePath(insetGeometry(normalized, safeBorderWidth / 2));
  translate(paths.borderCenter, safeBorderWidth / 2);
  paths.inner = createSquirclePath(insetGeometry(normalized, safeBorderWidth));
  translate(paths.inner, safeBorderWidth);
  return paths;
}

} // namespace margelo::nitro::nitrosquircle
