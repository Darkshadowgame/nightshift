Pod::Spec.new do |s|
  s.name           = 'NavLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Lock screen and Dynamic Island turn-by-turn directions for Slipstream'
  s.description    = 'Starts, updates and ends an ActivityKit Live Activity from the app. Local only: no push, no App Group.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.weak_frameworks = 'ActivityKit'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
