import NitroModules
import UIKit

final class HybridSquircleNativeView: HybridSquircleNativeViewSpec, RecyclableView {
  let view = SquircleRenderView()

  private let stateLock = NSLock()
  private var state = SquircleRenderState()
  private var batching = false

  var cornerSmoothing: Double {
    get { read(\.cornerSmoothing) }
    set { write(\.cornerSmoothing, newValue) }
  }
  var squircleBackgroundColor: Double {
    get { read(\.backgroundColor) }
    set { write(\.backgroundColor, newValue) }
  }
  var squircleBorderColor: Double {
    get { read(\.borderColor) }
    set { write(\.borderColor, newValue) }
  }
  var squircleBorderWidth: Double {
    get { read(\.borderWidth) }
    set { write(\.borderWidth, newValue) }
  }
  var squircleBorderStyle: SquircleBorderStyle {
    get { read(\.borderStyle) }
    set { write(\.borderStyle, newValue) }
  }
  var topLeftRadius: Double {
    get { read(\.topLeftRadius) }
    set { write(\.topLeftRadius, newValue) }
  }
  var topRightRadius: Double {
    get { read(\.topRightRadius) }
    set { write(\.topRightRadius, newValue) }
  }
  var bottomRightRadius: Double {
    get { read(\.bottomRightRadius) }
    set { write(\.bottomRightRadius, newValue) }
  }
  var bottomLeftRadius: Double {
    get { read(\.bottomLeftRadius) }
    set { write(\.bottomLeftRadius, newValue) }
  }
  var overflowHidden: Bool {
    get { read(\.overflowHidden) }
    set { write(\.overflowHidden, newValue) }
  }
  var squircleShadowColor: Double {
    get { read(\.shadowColor) }
    set { write(\.shadowColor, newValue) }
  }
  var squircleShadowOpacity: Double {
    get { read(\.shadowOpacity) }
    set { write(\.shadowOpacity, newValue) }
  }
  var squircleShadowRadius: Double {
    get { read(\.shadowRadius) }
    set { write(\.shadowRadius, newValue) }
  }
  var shadowOffsetX: Double {
    get { read(\.shadowOffsetX) }
    set { write(\.shadowOffsetX, newValue) }
  }
  var shadowOffsetY: Double {
    get { read(\.shadowOffsetY) }
    set { write(\.shadowOffsetY, newValue) }
  }

  func beforeUpdate() {
    stateLock.lock()
    batching = true
    stateLock.unlock()
  }

  func afterUpdate() {
    stateLock.lock()
    batching = false
    let snapshot = state
    stateLock.unlock()
    apply(snapshot)
  }

  func prepareForRecycle() {
    stateLock.lock()
    state = SquircleRenderState()
    batching = false
    stateLock.unlock()
    if Thread.isMainThread {
      view.reset()
    } else {
      DispatchQueue.main.async { [weak view] in view?.reset() }
    }
  }

  private func read<Value>(_ keyPath: KeyPath<SquircleRenderState, Value>) -> Value {
    stateLock.lock()
    defer { stateLock.unlock() }
    return state[keyPath: keyPath]
  }

  private func write<Value>(_ keyPath: WritableKeyPath<SquircleRenderState, Value>, _ value: Value) {
    stateLock.lock()
    state[keyPath: keyPath] = value
    let shouldApply = !batching
    let snapshot = state
    stateLock.unlock()
    if shouldApply {
      apply(snapshot)
    }
  }

  private func apply(_ snapshot: SquircleRenderState) {
    if Thread.isMainThread {
      view.apply(snapshot)
    } else {
      DispatchQueue.main.async { [weak view] in view?.apply(snapshot) }
    }
  }
}
