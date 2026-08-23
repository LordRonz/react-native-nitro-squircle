#include <jni.h>
#include <fbjni/fbjni.h>
#include "NitroSquircleOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::nitrosquircle::registerAllNatives();
  });
}
