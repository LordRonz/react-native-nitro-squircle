project(NitroSquircle)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME NitroSquircle)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        src/main/cpp/SquircleGeometryJni.cpp
        ../cpp/HybridSquircleDiagnostics.cpp
        ../cpp/SquircleGeometry.cpp
        ../cpp/SquircleInstrumentation.cpp
        ../cpp/SquirclePathCache.cpp
)

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroSquircle+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android                                   # <-- Android core
)
