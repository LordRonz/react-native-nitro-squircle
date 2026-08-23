#pragma once

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNSquircleGeometryEngine : NSObject

- (BOOL)updateWithWidth:(CGFloat)width
                 height:(CGFloat)height
          topLeftRadius:(CGFloat)topLeftRadius
         topRightRadius:(CGFloat)topRightRadius
      bottomRightRadius:(CGFloat)bottomRightRadius
       bottomLeftRadius:(CGFloat)bottomLeftRadius
              smoothing:(CGFloat)smoothing
            borderWidth:(CGFloat)borderWidth;

- (nullable CGPathRef)outerPath CF_RETURNS_NOT_RETAINED;
- (nullable CGPathRef)borderCenterPath CF_RETURNS_NOT_RETAINED;
- (void)reset;

@end

NS_ASSUME_NONNULL_END
