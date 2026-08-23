import NitroModules
import UIKit

struct SquircleRenderState: @unchecked Sendable {
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
  private let backgroundLayer = CAShapeLayer()
  private let borderLayer = CAShapeLayer()
  private let shadowLayer = CAShapeLayer()
  private let clipMask = CAShapeLayer()
  private weak var hostView: UIView?
  private var state = SquircleRenderState()

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isOpaque = false
    backgroundColor = .clear
    backgroundLayer.zPosition = -1_024
    shadowLayer.zPosition = -1_025
    borderLayer.zPosition = 1_024
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
    geometry.reset()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    backgroundLayer.path = nil
    borderLayer.path = nil
    shadowLayer.path = nil
    clipMask.path = nil
    clearHostMask()
    CATransaction.commit()
  }

  private func attachLayersIfNeeded() {
    guard let host = superview, host !== hostView else { return }
    detachLayers()
    hostView = host
    host.layer.addSublayer(shadowLayer)
    host.layer.addSublayer(backgroundLayer)
    host.layer.addSublayer(borderLayer)
  }

  private func detachLayers() {
    clearHostMask()
    backgroundLayer.removeFromSuperlayer()
    borderLayer.removeFromSuperlayer()
    shadowLayer.removeFromSuperlayer()
    hostView = nil
  }

  private func clearHostMask() {
    if hostView?.layer.mask === clipMask {
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
    let geometryChanged = geometry.update(
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
    for layer in [shadowLayer, backgroundLayer, borderLayer] {
      layer.frame = bounds
      layer.contentsScale = window?.screen.scale ?? UIScreen.main.scale
    }

    if geometryChanged {
      let outerPath = geometry.outerPath()
      backgroundLayer.path = outerPath
      shadowLayer.path = outerPath
      shadowLayer.shadowPath = outerPath
      borderLayer.path = geometry.borderCenterPath()
      clipMask.path = outerPath
    }

    let background = Self.color(from: state.backgroundColor)
    backgroundLayer.fillColor = background.cgColor
    shadowLayer.fillColor = background.cgColor
    shadowLayer.shadowColor = Self.color(from: state.shadowColor).cgColor
    shadowLayer.shadowOpacity = Float(max(state.shadowOpacity, 0))
    shadowLayer.shadowRadius = max(state.shadowRadius, 0)
    shadowLayer.shadowOffset = CGSize(width: state.shadowOffsetX, height: state.shadowOffsetY)

    borderLayer.fillColor = UIColor.clear.cgColor
    borderLayer.strokeColor = Self.color(from: state.borderColor).cgColor
    borderLayer.lineWidth = max(state.borderWidth, 0)
    borderLayer.lineDashPattern = Self.dashPattern(for: state.borderStyle, width: borderLayer.lineWidth)
    borderLayer.lineCap = state.borderStyle == .dotted ? .round : .butt
    borderLayer.isHidden = state.borderWidth <= 0

    if state.overflowHidden {
      host.layer.mask = clipMask
    } else {
      clearHostMask()
    }
    CATransaction.commit()
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
