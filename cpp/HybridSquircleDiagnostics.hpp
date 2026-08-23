#pragma once

#include "HybridSquircleDiagnosticsSpec.hpp"

namespace margelo::nitro::nitrosquircle {

class HybridSquircleDiagnostics final : public HybridSquircleDiagnosticsSpec {
public:
  HybridSquircleDiagnostics() : HybridObject(TAG) {}

  [[nodiscard]] SquircleDebugStats getSnapshot() override;
  void reset() override;
};

} // namespace margelo::nitro::nitrosquircle
