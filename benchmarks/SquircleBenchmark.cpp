#include "SquirclePathCache.hpp"

#include <algorithm>
#include <array>
#include <chrono>
#include <cstdio>

using namespace margelo::nitro::nitrosquircle;

static volatile double sink = 0;

int main() {
  constexpr int iterations = 200000;
  const char* labels[] = {
      "cache hit", "uniform resize, no border", "uniform resize, border",
      "mixed resize, border", "border width only",
  };
  for (int scenario = 0; scenario < 5; ++scenario) {
    std::array<double, 7> timings{};
    for (int trial = -1; trial < 7; ++trial) {
      SquirclePathCache cache;
      SquircleGeometry geometry{200, 100, {24, 24, 24, 24}, 0.6f};
      if (scenario == 3) geometry.radii = {32, 24, 16, 8};
      float border = scenario == 1 ? 0 : 2;
      (void)cache.update(geometry, border);
      const auto start = std::chrono::steady_clock::now();
      double checksum = 0;
      for (int i = 0; i < iterations; ++i) {
        if (scenario >= 1 && scenario <= 3) geometry.width = 200 + (i % 31);
        if (scenario == 4) border = 1 + (i % 4);
        checksum += cache.update(geometry, border) != 0;
        checksum += cache.paths().outer.commands[0].point1.x;
      }
      const auto finish = std::chrono::steady_clock::now();
      sink = checksum;
      if (trial >= 0) {
        timings[trial] = std::chrono::duration<double, std::nano>(finish - start).count() / iterations;
      }
    }
    std::sort(timings.begin(), timings.end());
    std::printf("%-28s %8.1f ns/update\n", labels[scenario], timings[3]);
  }
}
