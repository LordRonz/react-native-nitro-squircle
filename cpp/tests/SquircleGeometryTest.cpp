#include "SquircleGeometry.hpp"
#include "SquircleInstrumentation.hpp"
#include "SquirclePathCache.hpp"

#include <cmath>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <string_view>

using namespace margelo::nitro::nitrosquircle;

namespace {

void expect(bool condition, std::string_view message) {
  if (!condition) {
    std::cerr << "FAILED: " << message << '\n';
    std::exit(EXIT_FAILURE);
  }
}

bool isFinite(const SquirclePath& path) {
  for (std::size_t index = 0; index < path.count; ++index) {
    const auto& command = path.commands[index];
    const float values[] = {
        command.point1.x, command.point1.y, command.point2.x, command.point2.y,
        command.point3.x, command.point3.y, command.radius, command.startAngle,
        command.endAngle};
    for (float value : values) {
      if (!std::isfinite(value)) {
        return false;
      }
    }
  }
  return true;
}

void testNormalization() {
  const auto normalized = normalizeGeometry({
      .width = -10,
      .height = std::numeric_limits<float>::infinity(),
      .radii = {-1, 20, 30, std::numeric_limits<float>::quiet_NaN()},
      .smoothing = 4,
  });

  expect(normalized.width == 0, "negative width clamps to zero");
  expect(normalized.height == 0, "non-finite height clamps to zero");
  expect(normalized.radii == CornerRadii{0, 0, 0, 0}, "radii are safe for an empty shape");
  expect(normalized.smoothing == 1, "smoothing clamps to one");

  const auto scaled = normalizeGeometry({100, 50, {80, 80, 80, 80}, 0.6f});
  expect(scaled.radii == CornerRadii{25, 25, 25, 25}, "overlapping radii scale proportionally");
}

void testRequiredMatrix() {
  constexpr float smoothings[] = {0, 0.2f, 0.6f, 1};
  constexpr float radii[] = {0, 1, 4, 16, 32, 200};
  constexpr std::array<std::array<float, 2>, 6> sizes = {{{100, 100},
                                                          {160, 80},
                                                          {400, 24},
                                                          {24, 400},
                                                          {0.5f, 0.75f},
                                                          {100.25f, 50.5f}}};

  for (float smoothing : smoothings) {
    for (float radius : radii) {
      for (const auto& size : sizes) {
        const SquircleGeometry uniform{size[0], size[1], {radius, radius, radius, radius}, smoothing};
        const auto uniformPath = createSquirclePath(uniform);
        expect(uniformPath.count > 0, "positive dimensions create a path");
        expect(isFinite(uniformPath), "uniform paths remain finite");
        expect(uniformPath == createSquirclePath(uniform), "path generation is deterministic");

        const SquircleGeometry individual{
            size[0], size[1], {radius, radius / 2, radius / 4, radius / 8}, smoothing};
        expect(isFinite(createSquirclePath(individual)), "per-corner paths remain finite");
      }
    }
  }
}

void testEmptyShapes() {
  expect(createSquirclePath({0, 100, {20, 20, 20, 20}, 0.6f}).count == 0,
         "zero width creates an empty path");
  expect(createSquirclePath({100, 0, {20, 20, 20, 20}, 0.6f}).count == 0,
         "zero height creates an empty path");
}

void testBorderPaths() {
  const auto paths = createSquirclePaths({120, 80, {32, 24, 16, 8}, 0.6f}, 4);
  expect(paths.outer.count > 0, "outer border path exists");
  expect(paths.borderCenter.count > 0, "center border path exists");

  const auto noBorder = createSquirclePaths({120, 80, {32, 24, 16, 8}, 0.6f}, 0);
  expect(noBorder.borderCenter.count == 0, "zero-width border has no center path");
}

void testMixedCornerFixture() {
  const auto path = createSquirclePath({120, 80, {32, 0, 16, 0}, 0});
  constexpr std::array<Point, 2> expectedArcCenters = {{{104, 64}, {32, 32}}};
  std::size_t arcIndex = 0;
  bool reachesSharpBottomLeft = false;

  expect(path.count == 9, "zero-radius corners add no redundant commands");
  expect(path.commands.front().type == PathCommandType::MoveTo, "mixed fixture starts with move");
  expect(path.commands.front().point1 == Point{120, 0}, "zero top-right radius starts at the sharp corner");
  for (std::size_t index = 0; index < path.count; ++index) {
    const auto& command = path.commands[index];
    if (command.type == PathCommandType::LineTo && command.point1 == Point{0, 80}) {
      reachesSharpBottomLeft = true;
    }
    if (command.type == PathCommandType::ArcTo) {
      expect(arcIndex < expectedArcCenters.size(), "zero-radius corners do not create arcs");
      expect(command.point1 == expectedArcCenters[arcIndex], "mixed-radius arc center is stable");
      ++arcIndex;
    }
  }
  expect(arcIndex == expectedArcCenters.size(), "only positive-radius corners create arcs");
  expect(reachesSharpBottomLeft, "zero bottom-left radius reaches the sharp corner");
  expect(path.commands[path.count - 1].type == PathCommandType::Close, "mixed fixture closes the path");
}

void testRoundedRectFixture() {
  const auto path = createSquirclePath({100, 100, {20, 20, 20, 20}, 0});
  expect(path.count == 9, "smoothing zero uses four exact circular arcs");
  expect(path.commands.front().type == PathCommandType::MoveTo, "fixture starts with move");
  expect(path.commands.front().point1 == Point{80, 0}, "fixture starts at the top-right tangent");
  expect(path.commands[1].type == PathCommandType::ArcTo, "fixture uses an arc for the top-right corner");
  expect(path.commands[1].point1 == Point{80, 20}, "top-right arc center is stable");
  expect(path.commands[path.count - 1].type == PathCommandType::Close, "fixture closes the path");

  const auto smoothed = createSquirclePath({100, 100, {20, 20, 20, 20}, 0.6f});
  expect(smoothed.count == SquirclePath::maxCommands, "the fixed buffer fits the maximum command path exactly");
}

void testNoOpUpdates() {
  SquircleInstrumentation::reset();
  SquirclePathCache cache;
  const SquircleGeometry geometry{200, 100, {24, 24, 24, 24}, 0.6f};

  expect(cache.update(geometry, 2), "first cache update regenerates paths");
  expect(!cache.update(geometry, 2), "identical geometry is a no-op");
  auto smoothingUpdate = geometry;
  smoothingUpdate.smoothing = 0.8f;
  expect(cache.update(smoothingUpdate, 2), "smoothing invalidates geometry");
  auto layoutUpdate = geometry;
  layoutUpdate.width = 201;
  expect(cache.update(layoutUpdate, 2), "layout invalidates geometry");
  expect(cache.update(geometry, 4), "border width invalidates border geometry");

  const auto stats = SquircleInstrumentation::snapshot();
  expect(stats.cacheHits == 1, "no-op update records one cache hit");
  expect(stats.cacheMisses == 4, "changed updates record cache misses");
  expect(stats.geometryCalculations == 4, "only changed updates calculate geometry");
  expect(stats.pathCreations == 8, "border updates create only rendered paths");
}

} // namespace

int main() {
  testNormalization();
  testRequiredMatrix();
  testEmptyShapes();
  testBorderPaths();
  testMixedCornerFixture();
  testRoundedRectFixture();
  testNoOpUpdates();
  std::cout << "Squircle geometry tests passed\n";
}
