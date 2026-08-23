package com.margelo.nitro.nitrosquircle

import android.graphics.Path
import android.graphics.RectF
import androidx.annotation.Keep
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

@Keep
internal class SquircleGeometryBridge : AutoCloseable {
  val outerPath = Path()
  val borderCenterPath = Path()

  private val outerBytes = directBuffer()
  private val borderBytes = directBuffer()
  private val outerValues = outerBytes.asFloatBuffer()
  private val borderValues = borderBytes.asFloatBuffer()
  private val arcBounds = RectF()
  private var handle = 0L

  fun update(
    width: Float,
    height: Float,
    topLeftRadius: Float,
    topRightRadius: Float,
    bottomRightRadius: Float,
    bottomLeftRadius: Float,
    smoothing: Float,
    borderWidth: Float,
  ): Boolean {
    if (handle == 0L) handle = nativeCreate()
    val result = nativeUpdate(
      handle,
      width,
      height,
      topLeftRadius,
      topRightRadius,
      bottomRightRadius,
      bottomLeftRadius,
      smoothing,
      borderWidth,
      outerBytes,
      borderBytes,
    )
    if (result and CHANGED == 0L) return false

    decode(outerValues, (result and COUNT_MASK).toInt(), outerPath)
    decode(borderValues, (result shr 8 and COUNT_MASK).toInt(), borderCenterPath)
    return true
  }

  fun reset() {
    if (handle != 0L) nativeReset(handle)
    outerPath.reset()
    borderCenterPath.reset()
  }

  override fun close() {
    if (handle != 0L) {
      nativeDestroy(handle)
      handle = 0
    }
    outerPath.reset()
    borderCenterPath.reset()
  }

  private fun decode(values: FloatBuffer, count: Int, path: Path) {
    path.reset()
    for (index in 0 until count) {
      val offset = index * FLOATS_PER_COMMAND
      when (values.get(offset).toInt()) {
        MOVE_TO -> path.moveTo(values.get(offset + 1), values.get(offset + 2))
        LINE_TO -> path.lineTo(values.get(offset + 1), values.get(offset + 2))
        CUBIC_TO -> path.cubicTo(
          values.get(offset + 1),
          values.get(offset + 2),
          values.get(offset + 3),
          values.get(offset + 4),
          values.get(offset + 5),
          values.get(offset + 6),
        )
        ARC_TO -> {
          val centerX = values.get(offset + 1)
          val centerY = values.get(offset + 2)
          val radius = values.get(offset + 3)
          val start = Math.toDegrees(values.get(offset + 4).toDouble()).toFloat()
          val end = Math.toDegrees(values.get(offset + 5).toDouble()).toFloat()
          var sweep = end - start
          val clockwise = values.get(offset + 6) != 0f
          if (clockwise && sweep < 0) sweep += 360f
          if (!clockwise && sweep > 0) sweep -= 360f
          arcBounds.set(centerX - radius, centerY - radius, centerX + radius, centerY + radius)
          path.arcTo(arcBounds, start, sweep, false)
        }
        CLOSE -> path.close()
        else -> error("Unknown squircle path command")
      }
    }
  }

  private external fun nativeCreate(): Long
  private external fun nativeDestroy(handle: Long)
  private external fun nativeReset(handle: Long)
  private external fun nativeUpdate(
    handle: Long,
    width: Float,
    height: Float,
    topLeftRadius: Float,
    topRightRadius: Float,
    bottomRightRadius: Float,
    bottomLeftRadius: Float,
    smoothing: Float,
    borderWidth: Float,
    outerBuffer: ByteBuffer,
    borderBuffer: ByteBuffer,
  ): Long

  private companion object {
    const val MAX_COMMANDS = 17
    const val FLOATS_PER_COMMAND = 7
    const val COUNT_MASK = 0xffL
    const val CHANGED = 1L shl 16
    const val MOVE_TO = 0
    const val LINE_TO = 1
    const val CUBIC_TO = 2
    const val ARC_TO = 3
    const val CLOSE = 4

    fun directBuffer(): ByteBuffer =
      ByteBuffer.allocateDirect(MAX_COMMANDS * FLOATS_PER_COMMAND * Float.SIZE_BYTES)
        .order(ByteOrder.nativeOrder())
  }
}
