Pod::Spec.new do |s|
  s.name           = 'NavDirections'
  s.version        = '1.0.0'
  s.summary        = 'Driving directions and spoken instructions for Nightshift'
  s.description    = 'Routes through a list of points with Apple MapKit directions (coordinates only) and speaks turn instructions with AVSpeechSynthesizer.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.frameworks     = 'MapKit', 'AVFoundation', 'AudioToolbox', 'Vision', 'ImageIO'

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
