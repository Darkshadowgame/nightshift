import Foundation
import ImageIO
import Vision

/// Text from a photo, on the phone (the dyno sheet reader, src/lib/ocr.ts). Apple Vision's
/// VNRecognizeTextRequest, accurate, en-GB first with language correction off (figures and units
/// matter more than words). Nothing leaves the phone. Lines come back top to bottom, one per line,
/// with the cells of a table row joined by two spaces, so the parser (dynoParse.ts) can read
/// "RPM  Power  Torque" rows.
enum NavTextReader {
  enum Failure: LocalizedError {
    case cannotOpen
    var errorDescription: String? { "Couldn't open that photo." }
  }

  static func recognize(uri: String) throws -> String {
    let url: URL? = uri.hasPrefix("file://") ? URL(string: uri) : URL(fileURLWithPath: uri)
    guard let url, let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { throw Failure.cannotOpen }
    let opts: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: 3000,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) else { throw Failure.cannotOpen }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-GB", "en-US", "de-DE"]
    request.usesLanguageCorrection = false
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    let found = (request.results ?? []).compactMap { obs -> (box: CGRect, text: String)? in
      guard let top = obs.topCandidates(1).first else { return nil }
      return (obs.boundingBox, top.string)
    }
    return lines(found)
  }

  /// Group pieces whose vertical centres are close into one line (Vision's boxes have the origin
  /// bottom left), left to right within it.
  static func lines(_ pieces: [(box: CGRect, text: String)]) -> String {
    let sorted = pieces.sorted { $0.box.midY > $1.box.midY }
    var rows: [[(box: CGRect, text: String)]] = []
    for p in sorted {
      if let last = rows.last?.first, abs(last.box.midY - p.box.midY) < max(0.008, min(last.box.height, p.box.height) * 0.5) {
        rows[rows.count - 1].append(p)
      } else {
        rows.append([p])
      }
    }
    return rows
      .map { $0.sorted { $0.box.minX < $1.box.minX }.map { $0.text }.joined(separator: "  ") }
      .joined(separator: "\n")
  }
}
