import AVFoundation
import AudioToolbox
import ExpoModulesCore
import MapKit

/// Driving directions and spoken instructions for the in-app driving view.
/// - `route` asks Apple MapKit for driving directions leg by leg through the points, in order.
///   Only coordinates are sent: no names, addresses, account or event details. Times are for
///   leaving now, so they include Apple's live traffic.
/// - `routeAlternatives` (build 15): up to three routes from one point to another, each with its
///   name, advisory notices and whether it has tolls or motorways, for the route preview.
/// - `speak` / `stopSpeaking` read instructions out, ducking other audio: the voice picked in
///   Settings, or the best installed en-GB voice (premium > enhanced > default).
/// - `voices` lists the installed English voices for that picker.
/// - `chime` plays a short system sound (it follows the ring/silent switch).
/// - `recognizeText` reads the text in a photo with Apple Vision (the dyno sheet reader, build 12).
/// - `searchPlaces` / `resolvePlace`: "Where to?" autocomplete (MKLocalSearchCompleter) and the
///   chosen suggestion's position (MKLocalSearch). What's typed goes to Apple only; nothing is logged.
public class NavDirectionsModule: Module {
  private lazy var speaker = NavSpeaker()
  private lazy var places = NavPlaceSearch()

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

    // Build 15: route options for the preview (two points only), leaving now.
    AsyncFunction("routeAlternatives") { (points: [[String: Double]], maxAttempts: Int, promise: Promise) in
      let coords: [NavCoord] = points.compactMap { p in
        guard let lat = p["lat"], let lng = p["lng"] else { return nil }
        return NavCoord(lat: lat, lng: lng)
      }
      if coords.count != 2 {
        promise.reject("ERR_NAV_POINTS", "Route options need exactly two points.")
        return
      }
      let a = coords[0]
      let b = coords[1]
      let attempts = max(1, min(maxAttempts, 8))
      Task {
        do {
          let routes = try await NavRouter.retrying(maxAttempts: attempts) {
            try await NavRouter.calculateAll(from: a, to: b)
          }
          promise.resolve(NavRouter.options(routes))
        } catch let e as NavRouteError {
          promise.reject(e.code, e.message)
        } catch {
          promise.reject("ERR_NAV_ROUTE", error.localizedDescription)
        }
      }
    }

    AsyncFunction("speak") { (text: String, language: String, rate: Double, respectSilentSwitch: Bool, voice: String?) -> Bool in
      self.speaker.speak(text, language: language, rate: Float(rate), respectSilentSwitch: respectSilentSwitch, voiceId: voice)
      return true
    }.runOnQueue(.main)

    AsyncFunction("voices") { () -> [[String: Any]] in
      return NavSpeaker.englishVoices().map { v -> [String: Any] in
        [
          "identifier": v.identifier,
          "name": v.name,
          "language": v.language,
          "quality": NavSpeaker.qualityName(v.quality),
          "gender": NavSpeaker.genderName(v.gender),
        ]
      }
    }.runOnQueue(.main)

    AsyncFunction("searchPlaces") { (query: String, near: [String: Double]?, promise: Promise) in
      var centre: CLLocationCoordinate2D? = nil
      if let lat = near?["lat"], let lng = near?["lng"] {
        centre = CLLocationCoordinate2D(latitude: lat, longitude: lng)
      }
      self.places.search(query, near: centre, promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("resolvePlace") { (id: String, promise: Promise) in
      self.places.resolve(id, promise: promise)
    }.runOnQueue(.main)

    // Build 12: text from a photo for the dyno sheet reader (Apple Vision, on the phone).
    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          promise.resolve(try NavTextReader.recognize(uri: uri))
        } catch {
          promise.reject("ERR_TEXT_READ", error.localizedDescription)
        }
      }
    }

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

/// One of Apple's route options, with what the preview shows about it.
struct NavRouteOut: Sendable {
  let leg: NavLegOut
  let name: String
  let advisories: [String]
  let hasTolls: Bool
  let hasHighways: Bool
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
    return try await retrying(maxAttempts: maxAttempts) {
      try await NavRouter.calculate(from: a, to: b)
    }
  }

  /// Runs a directions request, retrying with backoff when Apple throttles or the network blips.
  static func retrying<T: Sendable>(maxAttempts: Int, _ op: @escaping @Sendable () async throws -> T) async throws -> T {
    var attempt = 0
    var delayNs: UInt64 = 1_500_000_000
    while true {
      attempt += 1
      do {
        return try await op()
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

  /// A driving request between two points, leaving now (so Apple's times include live traffic).
  @MainActor
  static func request(from a: NavCoord, to b: NavCoord) -> MKDirections.Request {
    let request = MKDirections.Request()
    // Coordinates only: no names or addresses go to Apple.
    request.source = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: a.lat, longitude: a.lng)))
    request.destination = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: b.lat, longitude: b.lng)))
    request.transportType = .automobile
    request.requestsAlternateRoutes = false
    request.departureDate = Date()
    return request
  }

  @MainActor
  static func calculate(from a: NavCoord, to b: NavCoord) async throws -> NavLegOut {
    let directions = MKDirections(request: request(from: a, to: b))
    let response = try await directions.calculate()
    guard let route = response.routes.first else {
      throw NavRouteError(code: "ERR_NAV_NO_ROUTE", message: "Apple Maps couldn't find a driving route between two of the points.")
    }
    return legOut(route, start: a)
  }

  /// Up to three of Apple's routes from a to b, best first.
  @MainActor
  static func calculateAll(from a: NavCoord, to b: NavCoord) async throws -> [NavRouteOut] {
    let req = request(from: a, to: b)
    req.requestsAlternateRoutes = true
    let response = try await MKDirections(request: req).calculate()
    if response.routes.isEmpty {
      throw NavRouteError(code: "ERR_NAV_NO_ROUTE", message: "Apple Maps couldn't find a driving route between the two points.")
    }
    return response.routes.prefix(3).map { r in
      var tolls = false
      var highways = false
      if #available(iOS 16.0, *) {
        tolls = r.hasTolls
        highways = r.hasHighways
      }
      return NavRouteOut(leg: legOut(r, start: a), name: r.name, advisories: r.advisoryNotices, hasTolls: tolls, hasHighways: highways)
    }
  }

  /// A route as one leg: its line, steps (each at its first point), length and time.
  @MainActor
  static func legOut(_ route: MKRoute, start a: NavCoord) -> NavLegOut {
    let coords = coordinates(of: route.polyline)
    let steps: [NavStepOut] = route.steps.map { s in
      let first = s.polyline.pointCount > 0 ? s.polyline.points()[0].coordinate : CLLocationCoordinate2D(latitude: a.lat, longitude: a.lng)
      return NavStepOut(text: s.instructions, notice: s.notice ?? "", distance: s.distance, lat: first.latitude, lng: first.longitude)
    }
    return NavLegOut(coords: coords, distance: route.distance, time: route.expectedTravelTime, steps: steps)
  }

  /// The answer for routeAlternatives: the first route in the old shape, plus `routes`, all of them.
  static func options(_ routes: [NavRouteOut]) -> [String: Any] {
    var list: [[String: Any]] = []
    for r in routes {
      var one = combine([r.leg])
      one["name"] = r.name
      one["advisoryNotices"] = r.advisories
      one["hasTolls"] = r.hasTolls
      one["hasHighways"] = r.hasHighways
      list.append(one)
    }
    var out: [String: Any] = list.first ?? combine([])
    out["routes"] = list
    return out
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

  /// Installed English voices, without novelty and Personal Voices.
  static func englishVoices() -> [AVSpeechSynthesisVoice] {
    return AVSpeechSynthesisVoice.speechVoices().filter { v in
      guard v.language.lowercased().hasPrefix("en") else { return false }
      if #available(iOS 17.0, *) {
        if v.voiceTraits.contains(.isNoveltyVoice) || v.voiceTraits.contains(.isPersonalVoice) { return false }
      }
      return true
    }
  }

  static func qualityName(_ q: AVSpeechSynthesisVoiceQuality) -> String {
    switch q {
    case .premium: return "premium"
    case .enhanced: return "enhanced"
    default: return "default"
    }
  }

  static func genderName(_ g: AVSpeechSynthesisVoiceGender) -> String {
    switch g {
    case .male: return "male"
    case .female: return "female"
    default: return "unspecified"
    }
  }

  static func qualityRank(_ q: AVSpeechSynthesisVoiceQuality) -> Int {
    switch q {
    case .premium: return 2
    case .enhanced: return 1
    default: return 0
    }
  }

  /// The best installed voice for the language: premium > enhanced > default, that language's
  /// voices first (en-GB), then any English. Ties go to the system's own voice for the language.
  static func bestVoice(language: String) -> AVSpeechSynthesisVoice? {
    let all = englishVoices()
    let same = all.filter { $0.language.caseInsensitiveCompare(language) == .orderedSame }
    let pool = same.isEmpty ? all : same
    let system = AVSpeechSynthesisVoice(language: language)?.identifier
    return pool.max { a, b in
      let ra = qualityRank(a.quality)
      let rb = qualityRank(b.quality)
      if ra != rb { return ra < rb }
      return (a.identifier == system ? 1 : 0) < (b.identifier == system ? 1 : 0)
    }
  }

  func speak(_ text: String, language: String, rate: Float, respectSilentSwitch: Bool, voiceId: String?) {
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
    var chosen: AVSpeechSynthesisVoice? = nil
    if let id = voiceId, !id.isEmpty {
      chosen = AVSpeechSynthesisVoice(identifier: id)
    }
    utterance.voice = chosen ?? NavSpeaker.bestVoice(language: language) ?? AVSpeechSynthesisVoice(language: language) ?? AVSpeechSynthesisVoice(language: "en-GB")
    // The normal speed is Apple's own default rate; Slower and Faster are a little either side.
    let natural = abs(rate - 0.5) < 0.001 ? AVSpeechUtteranceDefaultSpeechRate : rate
    utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, natural))
    utterance.pitchMultiplier = 1.0
    // A breath before speaking, so the first word isn't clipped while other audio ducks.
    utterance.preUtteranceDelay = 0.08
    // With VoiceOver on, its voice and speed win (what someone using it is used to hearing).
    utterance.prefersAssistiveTechnologySettings = true
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

// MARK: - Place search ("Where to?")

/// Live suggestions as you type (addresses and places such as shops and businesses), then the
/// chosen one's position. Only the latest search is answered; an older one gets an empty list.
final class NavPlaceSearch: NSObject, MKLocalSearchCompleterDelegate {
  private let completer = MKLocalSearchCompleter()
  private var pending: Promise?
  private var timeout: DispatchWorkItem?
  private var results: [MKLocalSearchCompletion] = []
  private var generation = 0
  private var active: MKLocalSearch?

  /// Rough box round the UK: the default bias when we don't know where you are. Not a limit.
  private static let ukRegion = MKCoordinateRegion(
    center: CLLocationCoordinate2D(latitude: 54.5, longitude: -3.0),
    span: MKCoordinateSpan(latitudeDelta: 11.0, longitudeDelta: 11.0)
  )

  override init() {
    super.init()
    completer.delegate = self
    completer.resultTypes = [.address, .pointOfInterest]
  }

  func search(_ query: String, near: CLLocationCoordinate2D?, promise: Promise) {
    // Only the latest search counts.
    answerPending(with: nil)
    pending = promise
    if let c = near {
      completer.region = MKCoordinateRegion(center: c, latitudinalMeters: 80_000, longitudinalMeters: 80_000)
    } else {
      completer.region = NavPlaceSearch.ukRegion
    }
    let item = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      self.answerPending(with: self.completer.results)
    }
    timeout = item
    DispatchQueue.main.asyncAfter(deadline: .now() + 6, execute: item)
    if completer.queryFragment == query && !completer.isSearching {
      // The same text again: no new results will come, so answer with what's there.
      answerPending(with: completer.results)
      return
    }
    completer.queryFragment = query
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    answerPending(with: completer.results)
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    timeout?.cancel()
    timeout = nil
    guard let p = pending else { return }
    pending = nil
    if let mk = error as? MKError, mk.code == .placemarkNotFound {
      results = []
      generation += 1
      p.resolve([[String: Any]]())
    } else {
      p.reject("ERR_PLACES", "Couldn't search just now. Check your signal and try again.")
    }
  }

  /// Answers the waiting search: `nil` means it was replaced by a newer one (an empty list).
  private func answerPending(with list: [MKLocalSearchCompletion]?) {
    timeout?.cancel()
    timeout = nil
    guard let p = pending else { return }
    pending = nil
    guard let list = list else {
      p.resolve([[String: Any]]())
      return
    }
    generation += 1
    results = Array(list.prefix(8))
    let gen = generation
    let out: [[String: Any]] = results.enumerated().map { (i, c) in
      ["id": "\(gen):\(i)", "title": c.title, "subtitle": c.subtitle]
    }
    p.resolve(out)
  }

  func resolve(_ id: String, promise: Promise) {
    let parts = id.split(separator: ":")
    guard parts.count == 2, let gen = Int(parts[0]), gen == generation, let i = Int(parts[1]), i >= 0, i < results.count else {
      promise.reject("ERR_PLACE_STALE", "That result has gone. Search again.")
      return
    }
    active?.cancel()
    let search = MKLocalSearch(request: MKLocalSearch.Request(completion: results[i]))
    active = search
    search.start { [weak self] response, error in
      self?.active = nil
      guard let item = response?.mapItems.first else {
        promise.reject("ERR_PLACE_NOT_FOUND", "Couldn't find that place. Try another result.")
        return
      }
      let pm = item.placemark
      let out: [String: Any] = [
        "lat": pm.coordinate.latitude,
        "lng": pm.coordinate.longitude,
        "name": item.name ?? "",
        "street": pm.thoroughfare ?? "",
        "streetNumber": pm.subThoroughfare ?? "",
        "district": pm.subLocality ?? "",
        "city": pm.locality ?? "",
        "subregion": pm.subAdministrativeArea ?? "",
        "region": pm.administrativeArea ?? "",
        "postalCode": pm.postalCode ?? "",
        "isoCountryCode": pm.isoCountryCode ?? "",
        "country": pm.country ?? "",
      ]
      promise.resolve(out)
    }
  }
}
