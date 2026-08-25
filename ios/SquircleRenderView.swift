import NitroModules
import UIKit

struct SquircleRenderState: Equatable, @unchecked Sendable {
  var cornerSmoothing = 0.6
  var backgroundColor = 0.0
  var borderColor = 0.0
  var borderWidth = 0.0
  var borderStyle = SquircleBorderStyle.solid
  var topLeftRadius = 0.0
  var topRightRadius = 0.0
  var bottomRightRadius = 0.0
  var bottomLeftRadius = 0.0
  var overflowHidden = false
  var shadowColor = Double(UInt32(0xFF000000))
  var shadowOpacity = 0.0
  var shadowRadius = 0.0
  var shadowOffsetX = 0.0
  var shadowOffsetY = 0.0
}

final class SquircleRenderView: UIView {
  private let geometry = RNSquircleGeometryEngine()
  private var backgroundLayer: CAShapeLayer?
  private var borderLayer: CAShapeLayer?
  private var shadowLayer: CAShapeLayer?
  private var clipMask: CAShapeLayer?
  private weak var hostView: UIView?
  private var state = SquircleRenderState()
  private var appliedState: SquircleRenderState?
  private var appliedBounds = CGRect.null

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isOpaque = false
    backgroundColor = .clear
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  deinit {
    detachLayers()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    attachLayersIfNeeded()
    applyCurrentState()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    applyCurrentState()
  }

  func apply(_ newState: SquircleRenderState) {
    state = newState
    applyCurrentState()
  }

  func reset() {
    state = SquircleRenderState()
    appliedState = nil
    appliedBounds = .null
    geometry.reset()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    backgroundLayer?.path = nil
    backgroundLayer?.fillColor = nil
    borderLayer?.path = nil
    borderLayer?.isHidden = true
    shadowLayer?.path = nil
    shadowLayer?.shadowPath = nil
    shadowLayer?.shadowOpacity = 0
    clipMask?.path = nil
    clearHostMask()
    CATransaction.commit()
  }

  private func attachLayersIfNeeded() {
    guard let host = superview else {
      detachLayers()
      return
    }
    guard host !== hostView else { return }
    detachLayers()
    hostView = host
    appliedState = nil
    appliedBounds = .null
    if let shadowLayer { host.layer.addSublayer(shadowLayer) }
    if let backgroundLayer { host.layer.addSublayer(backgroundLayer) }
    if let borderLayer { host.layer.addSublayer(borderLayer) }
  }

  private func detachLayers() {
    clearHostMask()
    backgroundLayer?.removeFromSuperlayer()
    borderLayer?.removeFromSuperlayer()
    shadowLayer?.removeFromSuperlayer()
    hostView = nil
  }

  private func clearHostMask() {
    if let clipMask, hostView?.layer.mask === clipMask {
      hostView?.layer.mask = nil
    }
  }

  private func applyCurrentState() {
    guard Thread.isMainThread else {
      let snapshot = state
      DispatchQueue.main.async { [weak self] in self?.apply(snapshot) }
      return
    }
    attachLayersIfNeeded()
    guard let host = hostView else { return }

    let bounds = host.bounds
    guard bounds.width > 0, bounds.height > 0 else { return }
    guard appliedState != state || appliedBounds != bounds else { return }

    let background = Self.color(from: state.backgroundColor)
    let drawsBackground = background.cgColor.alpha > 0
    let drawsBorder = state.borderWidth > 0
    let drawsShadow = state.shadowOpacity > 0
    let clipsChildren = state.overflowHidden

    let createsBackgroundLayer = drawsBackground && backgroundLayer == nil
    let createsBorderLayer = drawsBorder && borderLayer == nil
    let createsShadowLayer = drawsShadow && shadowLayer == nil
    let createsClipMask = clipsChildren && clipMask == nil

    if createsBackgroundLayer {
      backgroundLayer = makeLayer(zPosition: -1_024, on: host)
    }
    if createsBorderLayer {
      borderLayer = makeLayer(zPosition: 1_024, on: host)
    }
    if createsShadowLayer {
      shadowLayer = makeLayer(zPosition: -1_025, on: host)
    }
    if createsClipMask {
      clipMask = CAShapeLayer()
    }

    let drawsGeometry = drawsBackground || drawsBorder || drawsShadow || clipsChildren
    let geometryChanged = drawsGeometry && geometry.update(
      withWidth: bounds.width,
      height: bounds.height,
      topLeftRadius: state.topLeftRadius,
      topRightRadius: state.topRightRadius,
      bottomRightRadius: state.bottomRightRadius,
      bottomLeftRadius: state.bottomLeftRadius,
      smoothing: state.cornerSmoothing,
      borderWidth: state.borderWidth
    )

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for layer in [shadowLayer, backgroundLayer, borderLayer].compactMap({ $0 }) {
      layer.frame = bounds
      layer.contentsScale = window?.screen.scale ?? UIScreen.main.scale
    }

    let needsPathUpdate =
      geometryChanged || createsBackgroundLayer || createsBorderLayer || createsShadowLayer || createsClipMask
    if drawsGeometry && needsPathUpdate {
      let outerPath = geometry.outerPath()
      backgroundLayer?.path = outerPath
      shadowLayer?.path = outerPath
      shadowLayer?.shadowPath = outerPath
      borderLayer?.path = geometry.borderCenterPath()
      clipMask?.path = outerPath
    }

    backgroundLayer?.fillColor = background.cgColor

    shadowLayer?.fillColor = background.cgColor
    shadowLayer?.shadowColor = Self.color(from: state.shadowColor).cgColor
    shadowLayer?.shadowOpacity = Float(max(state.shadowOpacity, 0))
    shadowLayer?.shadowRadius = max(state.shadowRadius, 0)
    shadowLayer?.shadowOffset = CGSize(width: state.shadowOffsetX, height: state.shadowOffsetY)

    if let borderLayer {
      borderLayer.fillColor = UIColor.clear.cgColor
      borderLayer.strokeColor = Self.color(from: state.borderColor).cgColor
      borderLayer.lineWidth = max(state.borderWidth, 0)
      borderLayer.lineDashPattern = Self.dashPattern(
        for: state.borderStyle,
        width: borderLayer.lineWidth
      )
      borderLayer.lineCap = state.borderStyle == .dotted ? .round : .butt
      borderLayer.isHidden = !drawsBorder
    }

    if clipsChildren, let clipMask {
      host.layer.mask = clipMask
    } else {
      clearHostMask()
    }
    appliedState = state
    appliedBounds = bounds
    CATransaction.commit()
  }

  private func makeLayer(zPosition: CGFloat, on host: UIView) -> CAShapeLayer {
    let layer = CAShapeLayer()
    layer.zPosition = zPosition
    host.layer.addSublayer(layer)
    return layer
  }

  private static func color(from processedColor: Double) -> UIColor {
    let value = UInt32(truncatingIfNeeded: Int64(processedColor))
    return UIColor(
      red: CGFloat((value >> 16) & 0xFF) / 255,
      green: CGFloat((value >> 8) & 0xFF) / 255,
      blue: CGFloat(value & 0xFF) / 255,
      alpha: CGFloat((value >> 24) & 0xFF) / 255
    )
  }

  private static func dashPattern(for style: SquircleBorderStyle, width: CGFloat) -> [NSNumber]? {
    guard width > 0 else { return nil }
    switch style {
      case .solid:
        return nil
      case .dashed:
        return [NSNumber(value: width * 3), NSNumber(value: width * 2)]
      case .dotted:
        return [0, NSNumber(value: width * 2)]
    }
  }
}
