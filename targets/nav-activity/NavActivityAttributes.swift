import ActivityKit

/// Shared shape of the navigation Live Activity. A copy with the same name and fields is in
/// modules/nav-live-activity/ios/NavActivityAttributes.swift: keep the two identical.
struct NavActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Which manoeuvre symbol: straight, left, right, slightLeft, slightRight, sharpLeft, sharpRight,
    /// keepLeft, keepRight, uturn, roundabout, arrive.
    var arrow: String
    /// Distance to the manoeuvre, already worded ("300 yd", "1.2 mi"). Empty when arrived.
    var distance: String
    /// The road to turn onto, or the instruction.
    var road: String
    /// Distance left, already worded ("12 mi"). May be empty.
    var remaining: String
    /// Arrival time ("14:32"). May be empty.
    var eta: String
    /// The destination's name, as the driving view shows it.
    var destination: String
  }
}
