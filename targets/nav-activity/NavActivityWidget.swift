import ActivityKit
import SwiftUI
import WidgetKit

/// Slipstream brand: ink #0a0a0a, sodium green #95d600 (src/theme.ts SODIUM and INK).
private let ink = Color(red: 10 / 255, green: 10 / 255, blue: 10 / 255)
private let sodium = Color(red: 149 / 255, green: 214 / 255, blue: 0)

/// SF Symbol for each manoeuvre. UK roundabouts go clockwise.
private func symbol(_ arrow: String) -> String {
  switch arrow {
  case "left": return "arrow.turn.up.left"
  case "right": return "arrow.turn.up.right"
  case "slightLeft", "keepLeft": return "arrow.up.left"
  case "slightRight", "keepRight": return "arrow.up.right"
  case "sharpLeft": return "arrow.down.left"
  case "sharpRight": return "arrow.down.right"
  case "uturn": return "arrow.uturn.down"
  case "roundabout": return "arrow.clockwise"
  case "arrive": return "flag.checkered"
  default: return "arrow.up"
  }
}

private struct Arrow: View {
  let name: String
  let size: CGFloat
  var body: some View {
    Image(systemName: symbol(name))
      .font(.system(size: size, weight: .bold))
      .foregroundColor(sodium)
      .accessibilityHidden(true)
  }
}

private func spoken(_ s: NavActivityAttributes.ContentState) -> String {
  s.arrow == "arrive" ? s.road : "\(s.distance), \(s.road)"
}

/// The lock screen and banner.
private struct LockScreenView: View {
  let state: NavActivityAttributes.ContentState

  private var quietLine: String {
    [state.remaining, state.eta.isEmpty ? "" : "Arrive \(state.eta)"].filter { !$0.isEmpty }.joined(separator: " · ")
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .center, spacing: 16) {
        Arrow(name: state.arrow, size: 44).frame(width: 52)
        VStack(alignment: .leading, spacing: 2) {
          if !state.distance.isEmpty {
            Text(state.distance)
              .font(.system(size: 36, weight: .bold, design: .rounded))
              .foregroundColor(Color.white)
              .minimumScaleFactor(0.6)
              .lineLimit(1)
          }
          Text(state.road)
            .font(.system(size: 18, weight: .semibold))
            .foregroundColor(Color.white)
            .lineLimit(2)
            .minimumScaleFactor(0.8)
        }
        Spacer(minLength: 0)
      }
      VStack(alignment: .leading, spacing: 2) {
        if !quietLine.isEmpty {
          Text(quietLine).font(.system(size: 14, weight: .medium)).foregroundColor(Color.white.opacity(0.7))
        }
        if !state.destination.isEmpty {
          Text(state.destination).font(.system(size: 14)).foregroundColor(Color.white.opacity(0.7)).lineLimit(1)
        }
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("\(spoken(state)). \(quietLine). \(state.destination)"))
  }
}

struct NavActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NavActivityAttributes.self) { context in
      LockScreenView(state: context.state)
        .activityBackgroundTint(ink)
        .activitySystemActionForegroundColor(sodium)
    } dynamicIsland: { context in
      let s = context.state
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Arrow(name: s.arrow, size: 34)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(s.distance)
            .font(.system(size: 28, weight: .bold, design: .rounded))
            .foregroundColor(Color.white)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.center) {
          Text(s.road)
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(Color.white)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text([s.remaining, s.eta.isEmpty ? "" : "Arrive \(s.eta)"].filter { !$0.isEmpty }.joined(separator: " · "))
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Color.white.opacity(0.7))
        }
      } compactLeading: {
        Arrow(name: s.arrow, size: 16)
      } compactTrailing: {
        Text(s.distance)
          .font(.system(size: 14, weight: .semibold, design: .rounded))
          .foregroundColor(Color.white)
          .frame(maxWidth: 64)
          .minimumScaleFactor(0.7)
          .lineLimit(1)
      } minimal: {
        Arrow(name: s.arrow, size: 14)
      }
      .keylineTint(sodium)
    }
  }
}
