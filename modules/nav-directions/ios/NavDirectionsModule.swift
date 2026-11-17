import AVFoundation
import AudioToolbox
import ExpoModulesCore
import MapKit

/// Driving directions and spoken instructions for the in-app driving view.
/// - `route` asks Apple MapKit for driving directions leg by leg through the points, in order.
///   Only coordinates are sent: no names, addresses, account or event details.
/// - `speak` / `stopSpeaking` read instructions out with an en-GB voice, ducking other audio.
/// - `chime` plays a short system sound (it follows the ring/silent switch).
public class NavDirectionsModule: Module {
  private lazy var speaker = NavSpeaker()

  public func definition() -> ModuleDefinition {
    Name("NavDirections")

    Events("onRouteProgress")

    AsyncFunction("route") { (points: [[String: Double]], concurrency: Int, maxAttempts: Int, promise: Promise) in
      let coords: [NavCoord] = points.compactMap { p in
        guard let lat = p["lat"], let lng = p["lng"] else { return nil }
        return NavCoord(lat: lat, lng: lng)
      }
      if coords.count < 2 {
        promise.reject("ERR_NAV_POINTS", "A route needs at least two points.")
        return
      }
      let width = max(1, min(concurrency, 4))
      let attempts = max(1, min(maxAttempts, 8))
      Task {
        do {
          let result = try await NavRouter.route(coords, concurrency: width, maxAttempts: attempts) { done, total in
            DispatchQueue.main.async { [weak self] in
              self?.sendEvent("onRouteProgress", ["done": done, "total": total])
            }
          }
          promise.resolve(result)
        } catch let e as NavRouteError {
          promise.reject(e.code, e.message)
        } catch {
          promise.reject("ERR_NAV_ROUTE", error.localizedDescription)
        }
      }
    }

    AsyncFunction("speak") { (text: String, language: String, rate: Double, respectSilentSwitch: Bool) -> Bool in
      self.speaker.speak(text, language: language, rate: Float(rate), respectSilentSwitch: respectSilentSwitch)
      return true
    }.runOnQueue(.main)

    AsyncFunction("stopSpeaking") { () -> Bool in
      self.speaker.stop()
      return true
    }.runOnQueue(.main)

    Function("chime") { () -> Bool in
      AudioServicesPlaySystemSound(SystemSoundID(1103))
      return true
    }
  }
}

// MARK: - Directions

struct NavCoord: Sendable {
  let lat: Double
  let lng: Double
}

struct NavStepOut: Sendable {
  let text: String
  let notice: String
  let distance: Double
  let lat: Double
  let lng: Double
}

struct NavLegOut: Sendable {
  let coords: [NavCoord]
  let distance: Double
  let time: Double
  let steps: [NavStepOut]
}

struct NavRouteError: Error {
  let code: String
  let message: String
}

enum NavRouter {
  /// Routes leg by leg (MapKit takes one source and one destination per request), a few legs at a time,
  /// and joins the legs into one line with steps and leg boundaries.
  static func route(
    _ points: [NavCoord],
    concurrency: Int,
    maxAttempts: Int,
    progress: (Int, Int) -> Void
  ) async throws -> [String: Any] {
    let total = points.count - 1
    var legs = [NavLegOut?](repeating: nil, count: total)
    var start = 0
    while start < total {
      let end = min(start + concurrency, total)
      let batch = try await withThrowingTaskGroup(of: (Int, NavLegOut).self, returning: [(Int, NavLegOut)].self) { group in
        for i in start..<end {
          let a = points[i]
          let b = points[i + 1]
          group.addTask {
            let out = try await NavRouter.leg(from: a, to: b, maxAttempts: maxAttempts)
            return (i, out)
          }
        }
        var results: [(Int, NavLegOut)] = []
        for try await r in group {
          results.append(r)
        }
        return results
      }
      for (i, out) in batch {
        legs[i] = out
      }
      progress(end, total)
      start = end
    }
    return combine(legs.compactMap { $0 })
  }

  /// One leg, retried with backoff when Apple throttles requests or the network blips.
  static func leg(from a: NavCoord, to b: NavCoord, maxAttempts: Int) async throws -> NavLegOut {
    var attempt = 0
    var delayNs: UInt64 = 1_500_000_000
    while true {
      attempt += 1
      do {
        return try await NavRouter.calculate(from: a, to: b)
      } catch let e as NavRouteError {
        throw e
      } catch {
        var throttled = false
        var retryable = error is URLError
        var notFound = false
        if let mk = error as? MKError {
          throttled = mk.code == .loadingThrottled
          notFound = mk.code == .directionsNotFound
          retryable = throttled || mk.code == .serverFailure || mk.code == .unknown
        }
        if !retryable || attempt >= maxAttempts {
          if notFound {
            throw NavRouteError(code: "ERR_NAV_NO_ROUTE", message: "Apple Maps couldn't find a driving route between two of the points.")
          }
          if throttled {
            throw NavRouteError(code: "ERR_NAV_THROTTLED", message: "Apple Maps is busy. Wait a minute and try again.")
          }
          throw NavRouteError(code: "ERR_NAV_ROUTE", message: error.localizedDescription)
        }
        try await Task.sleep(nanoseconds: delayNs)
        delayNs = min(delayNs * 2, 20_000_000_000)
      }
    }
  }

  @MainActor
  static func calculate(from a: NavCoord, to b: NavCoord) async throws -> NavLegOut {
    let request = MKDirections.Request()
    // Coordinates only: no names or addresses go to Apple.
    request.source = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: a.lat, longitude: a.lng)))
    request.destination = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: b.lat, longitude: b.lng)))
    request.transportType = .automobile
    request.requestsAlternateRoutes = false
    let directions = MKDirections(request: request)
    let response = try await directions.calculate()
    guard let route = response.routes.first else {
      throw NavRouteError(code: "ERR_NAV_NO_ROUTE", message: "Apple Maps couldn't find a driving route between two of the points.")
    }
    let coords = coordinates(of: route.polyline)
    let steps: [NavStepOut] = route.steps.map { s in
      let first = s.polyline.pointCount > 0 ? s.polyline.points()[0].coordinate : CLLocationCoordinate2D(latitude: a.lat, longitude: a.lng)
      return NavStepOut(text: s.instructions, notice: s.notice ?? "", distance: s.distance, lat: first.latitude, lng: first.longitude)
    }
    return NavLegOut(coords: coords, distance: route.distance, time: route.expectedTravelTime, steps: steps)
  }

  static func coordinates(of polyline: MKPolyline) -> [NavCoord] {
    let n = polyline.pointCount
    if n == 0 { return [] }
    var raw = [CLLocationCoordinate2D](repeating: CLLocationCoordinate2D(latitude: 0, longitude: 0), count: n)
    polyline.getCoordinates(&raw, range: NSRange(location: 0, length: n))
    return raw.map { NavCoord(lat: $0.latitude, lng: $0.longitude) }
  }

  /// Squared distance in a rough local projection: enough to find the nearest vertex.
  static func near(_ a: NavCoord, _ b: NavCoord) -> Double {
    let dLat = a.lat - b.lat
    let dLng = (a.lng - b.lng) * cos(a.lat * Double.pi / 180)
    return dLat * dLat + dLng * dLng
  }

  static func combine(_ legs: [NavLegOut]) -> [String: Any] {
    var flat: [Double] = []
    var count = 0
    var steps: [[String: Any]] = []
    var legInfo: [[String: Any]] = []
    var distance = 0.0
    var time = 0.0

    for (li, leg) in legs.enumerated() {
      // Each leg starts where the last one ended: skip the repeated point.
      let skip = (count > 0 && !leg.coords.isEmpty) ? 1 : 0
      let base = count - skip
      for c in leg.coords.dropFirst(skip) {
        flat.append(c.lat)
        flat.append(c.lng)
        count += 1
      }
      // Each step starts at its manoeuvre: find that point on the leg's line, moving forward only.
      var from = 0
      for s in leg.steps {
        var best = from
        var bestD = Double.greatestFiniteMagnitude
        if !leg.coords.isEmpty {
          let target = NavCoord(lat: s.lat, lng: s.lng)
          for i in from..<leg.coords.count {
            let d = near(leg.coords[i], target)
            if d < bestD {
              bestD = d
              best = i
            }
          }
        }
        from = best
        steps.append([
          "text": s.text,
          "notice": s.notice,
          "distance": s.distance,
          "lat": s.lat,
          "lng": s.lng,
          "index": Double(max(0, base + best)),
          "leg": Double(li),
        ])
      }
      distance += leg.distance
      time += leg.time
      legInfo.append([
        "endIndex": Double(max(0, count - 1)),
        "distance": leg.distance,
        "time": leg.time,
      ])
    }

    return [
      "coords": flat,
      "distance": distance,
      "time": time,
      "steps": steps,
      "legs": legInfo,
    ]
  }
}

// MARK: - Speech

final class NavSpeaker: NSObject, AVSpeechSynthesizerDelegate {
  private let synth = AVSpeechSynthesizer()

  override init() {
    super.init()
    synth.delegate = self
  }

  func speak(_ text: String, language: String, rate: Float, respectSilentSwitch: Bool) {
    let session = AVAudioSession.sharedInstance()
    do {
      if respectSilentSwitch {
        // Ambient follows the ring/silent switch and mixes with other audio.
        try session.setCategory(.ambient, mode: .default, options: [])
      } else {
        // Plays with the switch on silent, and turns music or podcasts down while it speaks.
        try session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .interruptSpokenAudioAndMixWithOthers])
      }
      try session.setActive(true)
    } catch {
      // Speak anyway with whatever session there is.
    }
    if synth.isSpeaking {
      synth.stopSpeaking(at: .immediate)
    }
    let utterance = AVSpeechUtterance(string: text)
    utterance.voice = AVSpeechSynthesisVoice(language: language) ?? AVSpeechSynthesisVoice(language: "en-GB")
    utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, rate))
    synth.speak(utterance)
  }

  func stop() {
    synth.stopSpeaking(at: .immediate)
    deactivate()
  }

  private func deactivate() {
    // Let the music come back up.
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
    if !synthesizer.isSpeaking {
      deactivate()
    }
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
    if !synthesizer.isSpeaking {
      deactivate()
    }
  }
}
