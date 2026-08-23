#include <jni.h>

#include "SquirclePathCache.hpp"

#include <cstdint>
#include <new>
#include <stdexcept>

namespace margelo::nitro::nitrosquircle {
namespace {

constexpr std::size_t floatsPerCommand = 7;

void throwJava(JNIEnv* env, const char* className, const char* message) {
  if (const auto exception = env->FindClass(className)) {
    env->ThrowNew(exception, message);
  }
}

SquirclePathCache* cacheFrom(jlong handle) noexcept {
  return reinterpret_cast<SquirclePathCache*>(static_cast<std::uintptr_t>(handle));
}

bool writePath(JNIEnv* env, jobject buffer, const SquirclePath& path) {
  if (buffer == nullptr) {
    throwJava(env, "java/lang/IllegalArgumentException", "Path buffer cannot be null.");
    return false;
  }
  auto* values = static_cast<float*>(env->GetDirectBufferAddress(buffer));
  const auto capacity = env->GetDirectBufferCapacity(buffer);
  const auto requiredBytes = static_cast<jlong>(path.count * floatsPerCommand * sizeof(float));
  if (values == nullptr || capacity < requiredBytes) {
    throwJava(env, "java/lang/IllegalArgumentException", "Path buffer must be direct and large enough.");
    return false;
  }

  for (std::size_t index = 0; index < path.count; ++index) {
    const auto& command = path.commands[index];
    auto* output = values + index * floatsPerCommand;
    output[0] = static_cast<float>(command.type);
    output[1] = command.point1.x;
    output[2] = command.point1.y;
    output[3] = command.type == PathCommandType::ArcTo ? command.radius : command.point2.x;
    output[4] = command.type == PathCommandType::ArcTo ? command.startAngle : command.point2.y;
    output[5] = command.type == PathCommandType::ArcTo ? command.endAngle : command.point3.x;
    output[6] = command.type == PathCommandType::ArcTo ? (command.clockwise ? 1.0f : 0.0f) : command.point3.y;
  }
  return true;
}

} // namespace
} // namespace margelo::nitro::nitrosquircle

using namespace margelo::nitro::nitrosquircle;

extern "C" JNIEXPORT jlong JNICALL
Java_com_margelo_nitro_nitrosquircle_SquircleGeometryBridge_nativeCreate(JNIEnv* env, jobject) {
  try {
    return static_cast<jlong>(reinterpret_cast<std::uintptr_t>(new SquirclePathCache()));
  } catch (const std::bad_alloc&) {
    throwJava(env, "java/lang/OutOfMemoryError", "Could not allocate squircle geometry cache.");
    return 0;
  }
}

extern "C" JNIEXPORT void JNICALL
Java_com_margelo_nitro_nitrosquircle_SquircleGeometryBridge_nativeDestroy(JNIEnv*, jobject, jlong handle) {
  delete cacheFrom(handle);
}

extern "C" JNIEXPORT void JNICALL
Java_com_margelo_nitro_nitrosquircle_SquircleGeometryBridge_nativeReset(JNIEnv*, jobject, jlong handle) {
  if (auto* cache = cacheFrom(handle)) {
    cache->reset();
  }
}

extern "C" JNIEXPORT jlong JNICALL
Java_com_margelo_nitro_nitrosquircle_SquircleGeometryBridge_nativeUpdate(
    JNIEnv* env,
    jobject,
    jlong handle,
    jfloat width,
    jfloat height,
    jfloat topLeftRadius,
    jfloat topRightRadius,
    jfloat bottomRightRadius,
    jfloat bottomLeftRadius,
    jfloat smoothing,
    jfloat borderWidth,
    jobject outerBuffer,
    jobject borderBuffer) {
  auto* cache = cacheFrom(handle);
  if (cache == nullptr) {
    throwJava(env, "java/lang/IllegalStateException", "Squircle geometry cache is closed.");
    return 0;
  }

  const bool changed = cache->update(
      {
          .width = width,
          .height = height,
          .radii = {topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius},
          .smoothing = smoothing,
      },
      borderWidth);
  const auto& paths = cache->paths();
  if (changed && (!writePath(env, outerBuffer, paths.outer) ||
                  !writePath(env, borderBuffer, paths.borderCenter))) {
    return 0;
  }

  return static_cast<jlong>(paths.outer.count) |
      (static_cast<jlong>(paths.borderCenter.count) << 8) |
      (changed ? (static_cast<jlong>(1) << 16) : 0);
}
