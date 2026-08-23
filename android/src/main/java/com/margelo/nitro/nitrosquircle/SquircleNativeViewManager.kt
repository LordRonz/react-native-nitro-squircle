package com.margelo.nitro.nitrosquircle

import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewManager
import com.margelo.nitro.R.id.associated_hybrid_view_tag
import com.margelo.nitro.nitrosquircle.views.HybridSquircleNativeViewStateUpdater

internal class SquircleNativeViewManager : ReactViewManager() {
  private class Holder(
    val hybridView: HybridSquircleNativeView,
    var lastState: StateWrapper? = null,
  )

  init {
    setupViewRecycling()
  }

  override fun getName() = "SquircleNativeView"

  override fun createViewInstance(reactContext: ThemedReactContext): SquircleRenderView {
    val hybridView = HybridSquircleNativeView(reactContext)
    return hybridView.view.apply {
      setTag(associated_hybrid_view_tag, Holder(hybridView))
    }
  }

  override fun updateState(
    view: com.facebook.react.views.view.ReactViewGroup,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper,
  ): Any? {
    val holder = holder(view) ?: error("Missing SquircleNativeView holder")
    holder.hybridView.beforeUpdate()
    HybridSquircleNativeViewStateUpdater.updateViewProps(
      holder.hybridView,
      stateWrapper,
      holder.lastState,
    )
    holder.hybridView.afterUpdate()
    holder.lastState = stateWrapper
    return super.updateState(view, props, stateWrapper)
  }

  override fun onDropViewInstance(view: com.facebook.react.views.view.ReactViewGroup) {
    holder(view)?.apply {
      lastState = null
      hybridView.onDropView()
    }
    super.onDropViewInstance(view)
  }

  override fun prepareToRecycleView(
    reactContext: ThemedReactContext,
    view: com.facebook.react.views.view.ReactViewGroup,
  ): com.facebook.react.views.view.ReactViewGroup? {
    val holder = holder(view) ?: return null
    val prepared = super.prepareToRecycleView(reactContext, view) ?: return null
    holder.lastState = null
    holder.hybridView.prepareForRecycle()
    return prepared
  }

  private fun holder(view: com.facebook.react.views.view.ReactViewGroup): Holder? =
    view.getTag(associated_hybrid_view_tag) as? Holder
}
