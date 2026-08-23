#import "SquircleGeometryBridge.h"

#include "SquirclePathCache.hpp"

using margelo::nitro::nitrosquircle::PathCommandType;
using margelo::nitro::nitrosquircle::SquircleGeometry;
using margelo::nitro::nitrosquircle::SquirclePath;
using margelo::nitro::nitrosquircle::SquirclePathCache;

namespace {

CGPathRef _Nullable createCGPath(const SquirclePath& source) {
  if (source.count == 0) {
    return nil;
  }

  CGMutablePathRef path = CGPathCreateMutable();
  for (std::size_t index = 0; index < source.count; ++index) {
    const auto& command = source.commands[index];
    switch (command.type) {
      case PathCommandType::MoveTo:
        CGPathMoveToPoint(path, nullptr, command.point1.x, command.point1.y);
        break;
      case PathCommandType::LineTo:
        CGPathAddLineToPoint(path, nullptr, command.point1.x, command.point1.y);
        break;
      case PathCommandType::CubicTo:
        CGPathAddCurveToPoint(path, nullptr,
                              command.point1.x, command.point1.y,
                              command.point2.x, command.point2.y,
                              command.point3.x, command.point3.y);
        break;
      case PathCommandType::ArcTo:
        CGPathAddArc(path, nullptr,
                     command.point1.x, command.point1.y,
                     command.radius, command.startAngle, command.endAngle,
                     !command.clockwise);
        break;
      case PathCommandType::Close:
        CGPathCloseSubpath(path);
        break;
    }
  }
  return path;
}

} // namespace

@implementation RNSquircleGeometryEngine {
  SquirclePathCache _cache;
  CGPathRef _outerPath;
  CGPathRef _borderCenterPath;
}

- (instancetype)init {
  if (self = [super init]) {
    _outerPath = nil;
    _borderCenterPath = nil;
  }
  return self;
}

- (void)dealloc {
  if (_outerPath != nil) {
    CGPathRelease(_outerPath);
  }
  if (_borderCenterPath != nil) {
    CGPathRelease(_borderCenterPath);
  }
}

- (BOOL)updateWithWidth:(CGFloat)width
                 height:(CGFloat)height
          topLeftRadius:(CGFloat)topLeftRadius
         topRightRadius:(CGFloat)topRightRadius
      bottomRightRadius:(CGFloat)bottomRightRadius
       bottomLeftRadius:(CGFloat)bottomLeftRadius
              smoothing:(CGFloat)smoothing
            borderWidth:(CGFloat)borderWidth {
  const SquircleGeometry geometry{
      static_cast<float>(width),
      static_cast<float>(height),
      {
          static_cast<float>(topLeftRadius),
          static_cast<float>(topRightRadius),
          static_cast<float>(bottomRightRadius),
          static_cast<float>(bottomLeftRadius),
      },
      static_cast<float>(smoothing),
  };

  if (!_cache.update(geometry, static_cast<float>(borderWidth))) {
    return NO;
  }

  if (_outerPath != nil) {
    CGPathRelease(_outerPath);
  }
  if (_borderCenterPath != nil) {
    CGPathRelease(_borderCenterPath);
  }
  _outerPath = createCGPath(_cache.paths().outer);
  _borderCenterPath = createCGPath(_cache.paths().borderCenter);
  return YES;
}

- (CGPathRef _Nullable)outerPath {
  return _outerPath;
}

- (CGPathRef _Nullable)borderCenterPath {
  return _borderCenterPath;
}

- (void)reset {
  _cache.reset();
  if (_outerPath != nil) {
    CGPathRelease(_outerPath);
    _outerPath = nil;
  }
  if (_borderCenterPath != nil) {
    CGPathRelease(_borderCenterPath);
    _borderCenterPath = nil;
  }
}

@end
