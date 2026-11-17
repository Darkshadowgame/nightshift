import CoreImage
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

/// On-device number plate detection and redaction.
/// - `detectPlates` returns plate boxes only (normalised 0...1, top-left origin). The plate text never leaves this file.
/// - `redact` pixelates or fills boxes and writes a JPEG with no metadata (no GPS, EXIF, TIFF or maker notes).
public class PlateRedactorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PlateRedactor")

    AsyncFunction("detectPlates") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          promise.resolve(try PlateRedactorCore.detect(uri: uri))
        } catch {
          promise.reject("ERR_PLATE_DETECT", error.localizedDescription)
        }
      }
    }

    AsyncFunction("redact") { (uri: String, boxes: [[String: Double]], style: String, maxPixelSize: Int, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          promise.resolve(try PlateRedactorCore.redact(uri: uri, boxes: boxes, fill: style == "fill", maxPixelSize: maxPixelSize))
        } catch {
          promise.reject("ERR_PLATE_REDACT", error.localizedDescription)
        }
      }
    }
  }
}

enum PlateRedactorError: LocalizedError {
  case cannotOpen
  case cannotRender
  case cannotWrite

  var errorDescription: String? {
    switch self {
    case .cannotOpen: return "Could not open the photo."
    case .cannotRender: return "Could not process the photo."
    case .cannotWrite: return "Could not save the photo."
    }
  }
}

struct NormRect {
  var x: Double
  var y: Double
  var w: Double
  var h: Double

  var asDict: [String: Double] { ["x": x, "y": y, "w": w, "h": h] }

  func iou(_ o: NormRect) -> Double {
    let ix = max(0, min(x + w, o.x + o.w) - max(x, o.x))
    let iy = max(0, min(y + h, o.y + o.h) - max(y, o.y))
    let inter = ix * iy
    let union = w * h + o.w * o.h - inter
    return union > 0 ? inter / union : 0
  }

  func union(_ o: NormRect) -> NormRect {
    let nx = min(x, o.x), ny = min(y, o.y)
    return NormRect(x: nx, y: ny, w: max(x + w, o.x + o.w) - nx, h: max(y + h, o.y + o.h) - ny)
  }

  func padded(_ px: Double, _ py: Double) -> NormRect {
    let nx = max(0, x - w * px), ny = max(0, y - h * py)
    let nw = min(1 - nx, w * (1 + 2 * px)), nh = min(1 - ny, h * (1 + 2 * py))
    return NormRect(x: nx, y: ny, w: nw, h: nh)
  }
}

enum PlateRedactorCore {
  // UK formats: current (AB12 CDE), prefix (A123 BCD), suffix (ABC 123D), dateless and NI (ABC 1234, 1234 AB).
  static let patterns: [NSRegularExpression] = [
    "^[A-Z]{2}[0-9]{2}[A-Z]{3}$",
    "^[A-Z][0-9]{1,3}[A-Z]{3}$",
    "^[A-Z]{3}[0-9]{1,3}[A-Z]$",
    "^[A-Z]{1,3}[0-9]{1,4}$",
    "^[0-9]{1,4}[A-Z]{1,3}$",
  ].compactMap { try? NSRegularExpression(pattern: $0) }

  static func normalise(_ s: String) -> String {
    s.uppercased().filter { $0.isLetter || $0.isNumber }.filter { $0.isASCII }
  }

  static func looksLikePlate(_ raw: String) -> Bool {
    let s = normalise(raw)
    guard s.count >= 3 && s.count <= 8 else { return false }
    // Dateless patterns are loose; require letters and digits both present.
    guard s.contains(where: { $0.isLetter }) && s.contains(where: { $0.isNumber }) else { return false }
    let range = NSRange(location: 0, length: s.utf16.count)
    return patterns.contains { $0.firstMatch(in: s, range: range) != nil }
  }

  static func fileURL(_ uri: String) -> URL? {
    if let u = URL(string: uri), u.scheme != nil { return u }
    return URL(fileURLWithPath: uri)
  }

  /// Loads the photo with its orientation baked in, optionally scaled down.
  static func loadOriented(uri: String, maxPixelSize: Int = 0) throws -> CGImage {
    guard let url = fileURL(uri), let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { throw PlateRedactorError.cannotOpen }
    var size = maxPixelSize
    if size <= 0, let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] {
      let w = props[kCGImagePropertyPixelWidth] as? Int ?? 4096
      let h = props[kCGImagePropertyPixelHeight] as? Int ?? 4096
      size = max(w, h)
    }
    let opts: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: max(size, 1),
    ]
    guard let img = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) else { throw PlateRedactorError.cannotOpen }
    return img
  }

  struct TextBox {
    let rect: NormRect
    let candidates: [String]
  }

  /// Runs text recognition on a region and returns boxes in whole-image coordinates.
  static func recognise(_ image: CGImage, region: CGRect, fullW: Double, fullH: Double) -> [TextBox] {
    guard let crop = image.cropping(to: region) else { return [] }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.minimumTextHeight = 0.02
    let handler = VNImageRequestHandler(cgImage: crop, options: [:])
    do { try handler.perform([request]) } catch { return [] }
    guard let observations = request.results else { return [] }
    return observations.map { obs in
      let bb = obs.boundingBox // normalised to crop, bottom-left origin
      let x = (Double(region.minX) + Double(bb.minX) * Double(region.width)) / fullW
      let yTop = (Double(region.minY) + (1 - Double(bb.maxY)) * Double(region.height)) / fullH
      let w = Double(bb.width) * Double(region.width) / fullW
      let h = Double(bb.height) * Double(region.height) / fullH
      return TextBox(rect: NormRect(x: x, y: yTop, w: w, h: h), candidates: obs.topCandidates(3).map { $0.string })
    }
  }

  static func detect(uri: String) throws -> [String: Any] {
    let image = try loadOriented(uri: uri, maxPixelSize: 3000)
    let W = Double(image.width), H = Double(image.height)

    // Whole image plus 2x2 overlapping tiles, so small distant plates are big enough to read.
    var regions = [CGRect(x: 0, y: 0, width: W, height: H)]
    let tw = W * 0.6, th = H * 0.6
    for (ox, oy) in [(0.0, 0.0), (W - tw, 0.0), (0.0, H - th), (W - tw, H - th)] {
      regions.append(CGRect(x: ox, y: oy, width: tw, height: th).integral)
    }

    var texts: [TextBox] = []
    for r in regions { texts += recognise(image, region: r, fullW: W, fullH: H) }

    var found: [NormRect] = []
    for t in texts where t.candidates.contains(where: looksLikePlate) {
      found.append(t.rect)
    }

    // Two-line plates (motorbikes, some imports): join a short line with the one just below it.
    let short = texts.filter { (2...5).contains(normalise($0.candidates.first ?? "").count) }
    for a in short {
      for b in short where b.rect.y > a.rect.y {
        let gap = b.rect.y - (a.rect.y + a.rect.h)
        let overlapX = min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - max(a.rect.x, b.rect.x)
        guard gap >= -a.rect.h * 0.3, gap < a.rect.h * 0.9, overlapX > min(a.rect.w, b.rect.w) * 0.5 else { continue }
        let joined = a.candidates.flatMap { top in b.candidates.map { top + $0 } }
        if joined.contains(where: looksLikePlate) { found.append(a.rect.union(b.rect)) }
      }
    }

    // Pad and merge overlapping boxes.
    var merged: [NormRect] = []
    for r in found.map({ $0.padded(0.15, 0.35) }) {
      if let i = merged.firstIndex(where: { $0.iou(r) > 0.2 }) {
        merged[i] = merged[i].union(r)
      } else {
        merged.append(r)
      }
    }

    return [
      "width": image.width,
      "height": image.height,
      "boxes": merged.map { $0.asDict },
    ]
  }

  static func redact(uri: String, boxes: [[String: Double]], fill: Bool, maxPixelSize: Int) throws -> [String: Any] {
    let cg = try loadOriented(uri: uri, maxPixelSize: maxPixelSize > 0 ? maxPixelSize : 2048)
    let base = CIImage(cgImage: cg)
    let W = Double(cg.width), H = Double(cg.height)
    var output = base

    for b in boxes {
      guard let x = b["x"], let y = b["y"], let w = b["w"], let h = b["h"], w > 0, h > 0 else { continue }
      // Core Image uses a bottom-left origin.
      let rect = CGRect(x: x * W, y: H - (y + h) * H, width: w * W, height: h * H).integral
      let patch: CIImage
      if fill {
        patch = CIImage(color: CIColor(red: 0.07, green: 0.09, blue: 0.13)).cropped(to: rect)
      } else {
        // Big blocks (about 3 per plate height) so the characters can't be recovered.
        let scale = max(16.0, Double(rect.height) / 3.0)
        let pix = CIFilter(name: "CIPixellate")
        pix?.setValue(base.clampedToExtent(), forKey: kCIInputImageKey)
        pix?.setValue(scale, forKey: kCIInputScaleKey)
        pix?.setValue(CIVector(x: rect.midX, y: rect.midY), forKey: kCIInputCenterKey)
        guard let p = pix?.outputImage else { throw PlateRedactorError.cannotRender }
        patch = p.cropped(to: rect)
      }
      output = patch.composited(over: output)
    }

    let context = CIContext()
    guard let rendered = context.createCGImage(output, from: base.extent) else { throw PlateRedactorError.cannotRender }

    let dir = FileManager.default.temporaryDirectory.appendingPathComponent("redacted", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    let url = dir.appendingPathComponent(UUID().uuidString + ".jpg")
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
      throw PlateRedactorError.cannotWrite
    }
    // No metadata dictionary: only the pixels are written.
    CGImageDestinationAddImage(dest, rendered, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
    guard CGImageDestinationFinalize(dest) else { throw PlateRedactorError.cannotWrite }

    return ["uri": url.absoluteString, "width": rendered.width, "height": rendered.height]
  }
}
