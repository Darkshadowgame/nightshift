// The runtime fingerprint (app.json runtimeVersion policy) hashes package.json's scripts.
// The scorecard scripts only run the web export in a browser, so they are left out of the hash:
// adding or changing them must not need a new iPhone build.
/** @type {import('expo/fingerprint').Config} */
module.exports = {
  fileHookTransform(source, chunk) {
    if (source.type !== 'contents' || source.id !== 'packageJson:scripts' || typeof chunk !== 'string') return chunk;
    const scripts = JSON.parse(chunk);
    for (const key of Object.keys(scripts)) if (key === 'scorecard' || key.startsWith('scorecard:')) delete scripts[key];
    return JSON.stringify(scripts);
  },
};
