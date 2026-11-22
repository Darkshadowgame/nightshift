import ActivityKit
import ExpoModulesCore

/// Lock screen and Dynamic Island directions. The app starts and updates the activity itself (no push
/// notifications, no App Group), so it works in an unsigned build that is signed later with an Apple ID.
/// The look is in targets/nav-activity (the widget extension).
public class NavLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NavLiveActivity")

    /// False when Live Activities are switched off for the app in iOS Settings (or iOS is older than 16.2).
    Function("isEnabled") { () -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Starts the activity, ending any left over from an earlier run first. False if it couldn't start.
    AsyncFunction("start") { (state: [String: String]) -> Bool in
      guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
      for old in Activity<NavActivityAttributes>.activities {
        await old.end(nil, dismissalPolicy: .immediate)
      }
      do {
        _ = try Activity<NavActivityAttributes>.request(
          attributes: NavActivityAttributes(),
          content: ActivityContent(state: NavLiveActivityModule.stateOf(state), staleDate: NavLiveActivityModule.staleDate()),
          pushType: nil
        )
        return true
      } catch {
        return false
      }
    }

    AsyncFunction("update") { (state: [String: String]) -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      let activities = Activity<NavActivityAttributes>.activities
      for activity in activities {
        await activity.update(ActivityContent(state: NavLiveActivityModule.stateOf(state), staleDate: NavLiveActivityModule.staleDate()))
      }
      return !activities.isEmpty
    }

    /// Ends it. With a final state (arrived) it stays on the lock screen for `lingerSeconds`, else it goes at once.
    AsyncFunction("end") { (state: [String: String]?, lingerSeconds: Double) -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      for activity in Activity<NavActivityAttributes>.activities {
        if let state {
          await activity.end(
            ActivityContent(state: NavLiveActivityModule.stateOf(state), staleDate: nil),
            dismissalPolicy: .after(Date().addingTimeInterval(max(1, lingerSeconds)))
          )
        } else {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
      return true
    }
  }

  private static func stateOf(_ s: [String: String]) -> NavActivityAttributes.ContentState {
    NavActivityAttributes.ContentState(
      arrow: s["arrow"] ?? "straight",
      distance: s["distance"] ?? "",
      road: s["road"] ?? "",
      remaining: s["remaining"] ?? "",
      eta: s["eta"] ?? "",
      destination: s["destination"] ?? ""
    )
  }

  /// If the app stops updating (killed, no signal), iOS marks the activity out of date after this.
  private static func staleDate() -> Date {
    Date().addingTimeInterval(10 * 60)
  }
}
