Pod::Spec.new do |s|
  s.name           = 'PlateRedactor'
  s.version        = '1.0.0'
  s.summary        = 'On-device number plate detection and redaction for Nightshift'
  s.description    = 'Finds UK number plates with Apple Vision text recognition and pixelates them, writing JPEGs with no metadata.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
