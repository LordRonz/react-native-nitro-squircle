cmake_minimum_required(VERSION 3.16)
project(NitroSquircleGeometryTests LANGUAGES CXX)

enable_testing()

add_executable(
  squircle_geometry_tests
  SquircleGeometryTest.cpp
  ../SquircleGeometry.cpp
)

target_compile_features(squircle_geometry_tests PRIVATE cxx_std_20)
target_compile_options(squircle_geometry_tests PRIVATE -Wall -Wextra -Werror)
target_include_directories(squircle_geometry_tests PRIVATE ..)

add_test(NAME squircle_geometry_tests COMMAND squircle_geometry_tests)
