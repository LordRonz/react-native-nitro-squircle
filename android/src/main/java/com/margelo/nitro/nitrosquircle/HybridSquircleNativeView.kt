package com.margelo.nitro.nitrosquircle

import android.os.Looper
import com.facebook.react.uimanager.ThemedReactContext
import com.margelo.nitro.views.RecyclableView

internal class HybridSquircleNativeView(context: ThemedReactContext) :
  HybridSquircleNativeViewSpec(), RecyclableView {
  override val view = SquircleRenderView(context)

  private val state = SquircleRenderState()
  private var batching = false

  override var cornerSmoothing: Double
    get() = synchronized(state) { state.cornerSmoothing }
    set(value) = update { cornerSmoothing = value }
  override var squircleBackgroundColor: Double
    get() = synchronized(state) { state.backgroundColor }
    set(value) = update { backgroundColor = value }
  override var squircleBorderColor: Double
    get() = synchronized(state) { state.borderColor }
    set(value) = update { borderColor = value }
  override var squircleBorderWidth: Double
    get() = synchronized(state) { state.borderWidth }
    set(value) = update { borderWidth = value }
  override var squircleBorderStyle: SquircleBorderStyle
    get() = synchronized(state) { state.borderStyle }
    set(value) = update { borderStyle = value }
  override var topLeftRadius: Double
    get() = synchronized(state) { state.topLeftRadius }
    set(value) = update { topLeftRadius = value }
  override var topRightRadius: Double
    get() = synchronized(state) { state.topRightRadius }
    set(value) = update { topRightRadius = value }
  override var bottomRightRadius: Double
    get() = synchronized(state) { state.bottomRightRadius }
    set(value) = update { bottomRightRadius = value }
  override var bottomLeftRadius: Double
    get() = synchronized(state) { state.bottomLeftRadius }
    set(value) = update { bottomLeftRadius = value }
  override var overflowHidden: Boolean
    get() = synchronized(state) { state.overflowHidden }
    set(value) = update { overflowHidden = value }
  override var squircleShadowColor: Double
    get() = synchronized(state) { state.shadowColor }
    set(value) = update { shadowColor = value }
  override var squircleShadowOpacity: Double
    get() = synchronized(state) { state.shadowOpacity }
    set(value) = update { shadowOpacity = value }
  override var squircleShadowRadius: Double
    get() = synchronized(state) { state.shadowRadius }
    set(value) = update { shadowRadius = value }
  override var shadowOffsetX: Double
    get() = synchronized(state) { state.shadowOffsetX }
    set(value) = update { shadowOffsetX = value }
  override var shadowOffsetY: Double
    get() = synchronized(state) { state.shadowOffsetY }
    set(value) = update { shadowOffsetY = value }

  override fun beforeUpdate() {
    synchronized(state) { batching = true }
  }

  override fun afterUpdate() {
    val snapshot = synchronized(state) {
      batching = false
      state.copy()
    }
    apply(snapshot)
  }

  override fun prepareForRecycle() {
    synchronized(state) {
      state.copyFrom(SquircleRenderState())
      batching = false
    }
    view.post { view.reset() }
  }

  override fun onDropView() {
    view.post { view.close() }
  }

  private inline fun update(change: SquircleRenderState.() -> Unit) {
    val snapshot = synchronized(state) {
      state.change()
      if (batching) null else state.copy()
    }
    if (snapshot != null) apply(snapshot)
  }

  private fun apply(snapshot: SquircleRenderState) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      view.apply(snapshot)
    } else {
      view.post { view.apply(snapshot) }
    }
  }

  private fun SquircleRenderState.copyFrom(other: SquircleRenderState) {
    cornerSmoothing = other.cornerSmoothing
    backgroundColor = other.backgroundColor
    borderColor = other.borderColor
    borderWidth = other.borderWidth
    borderStyle = other.borderStyle
    topLeftRadius = other.topLeftRadius
    topRightRadius = other.topRightRadius
    bottomRightRadius = other.bottomRightRadius
    bottomLeftRadius = other.bottomLeftRadius
    overflowHidden = other.overflowHidden
    shadowColor = other.shadowColor
    shadowOpacity = other.shadowOpacity
    shadowRadius = other.shadowRadius
    shadowOffsetX = other.shadowOffsetX
    shadowOffsetY = other.shadowOffsetY
  }
}
