package com.margelo.nitro.nitrosquircle

import android.content.Context
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Outline
import android.graphics.Paint
import android.view.View
import android.view.ViewOutlineProvider
import com.facebook.react.views.view.ReactViewGroup

internal data class SquircleRenderState(
  var cornerSmoothing: Double = 0.6,
  var backgroundColor: Double = 0.0,
  var borderColor: Double = 0.0,
  var borderWidth: Double = 0.0,
  var borderStyle: SquircleBorderStyle = SquircleBorderStyle.SOLID,
  var topLeftRadius: Double = 0.0,
  var topRightRadius: Double = 0.0,
  var bottomRightRadius: Double = 0.0,
  var bottomLeftRadius: Double = 0.0,
  var overflowHidden: Boolean = false,
  var shadowColor: Double = 0.0,
  var shadowOpacity: Double = 0.0,
  var shadowRadius: Double = 0.0,
  var shadowOffsetX: Double = 0.0,
  var shadowOffsetY: Double = 0.0,
)

internal class SquircleRenderView(context: Context) : ReactViewGroup(context) {
  private val geometry = SquircleGeometryBridge()
  private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
  private var state = SquircleRenderState()
  private var appliedState: SquircleRenderState? = null

  init {
    setWillNotDraw(false)
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        if (!geometry.outerPath.isEmpty) outline.setConvexPath(geometry.outerPath)
      }
    }
  }

  fun apply(nextState: SquircleRenderState) {
    if (appliedState == nextState) return
    state = nextState
    backgroundPaint.color = nextState.backgroundColor.toLong().toInt()
    borderPaint.color = nextState.borderColor.toLong().toInt()
    borderPaint.strokeWidth = dp(nextState.borderWidth)
    borderPaint.strokeCap =
      if (nextState.borderStyle == SquircleBorderStyle.DOTTED) Paint.Cap.ROUND else Paint.Cap.BUTT
    borderPaint.pathEffect = if (borderPaint.strokeWidth <= 0) {
      null
    } else {
      when (nextState.borderStyle) {
        SquircleBorderStyle.SOLID -> null
        SquircleBorderStyle.DASHED -> DashPathEffect(floatArrayOf(borderPaint.strokeWidth * 3, borderPaint.strokeWidth * 2), 0f)
        SquircleBorderStyle.DOTTED -> DashPathEffect(floatArrayOf(0f, borderPaint.strokeWidth * 2), 0f)
      }
    }
    updateGeometry()
    appliedState = nextState
    invalidate()
  }

  fun reset() {
    state = SquircleRenderState()
    appliedState = null
    geometry.reset()
    backgroundPaint.color = 0
    borderPaint.color = 0
    borderPaint.pathEffect = null
    invalidateOutline()
    invalidate()
  }

  fun close() = geometry.close()

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    updateGeometry()
  }

  override fun onDraw(canvas: Canvas) {
    if (!geometry.outerPath.isEmpty && backgroundPaint.color != 0) {
      canvas.drawPath(geometry.outerPath, backgroundPaint)
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    val saveCount = if (state.overflowHidden && !geometry.outerPath.isEmpty) {
      canvas.save().also { canvas.clipPath(geometry.outerPath) }
    } else {
      -1
    }
    super.dispatchDraw(canvas)
    if (saveCount >= 0) canvas.restoreToCount(saveCount)
    if (state.borderWidth > 0 && !geometry.borderCenterPath.isEmpty) {
      canvas.drawPath(geometry.borderCenterPath, borderPaint)
    }
  }

  private fun updateGeometry() {
    if (width <= 0 || height <= 0) return
    if (geometry.update(
        width.toFloat(),
        height.toFloat(),
        dp(state.topLeftRadius),
        dp(state.topRightRadius),
        dp(state.bottomRightRadius),
        dp(state.bottomLeftRadius),
        state.cornerSmoothing.toFloat(),
        dp(state.borderWidth),
      )) {
      invalidateOutline()
    }
  }

  private fun dp(value: Double): Float = (value * resources.displayMetrics.density).toFloat()
}
