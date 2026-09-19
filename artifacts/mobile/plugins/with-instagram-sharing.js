const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const INSTAGRAM_PACKAGE = "com.instagram.android";
const INSTAGRAM_STORIES_SCHEME = "instagram-stories";

function withInstagramSharing(config) {
  config = withInfoPlist(config, (result) => {
    const schemes = result.modResults.LSApplicationQueriesSchemes ?? [];
    if (!schemes.includes(INSTAGRAM_STORIES_SCHEME)) {
      result.modResults.LSApplicationQueriesSchemes = [...schemes, INSTAGRAM_STORIES_SCHEME];
    }
    return result;
  });

  config = withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    const queries = manifest.queries ?? [{}];
    const firstQuery = queries[0] ?? {};
    const packages = firstQuery.package ?? [];
    if (!packages.some((entry) => entry.$?.["android:name"] === INSTAGRAM_PACKAGE)) {
      firstQuery.package = [...packages, { $: { "android:name": INSTAGRAM_PACKAGE } }];
    }
    queries[0] = firstQuery;
    manifest.queries = queries;
    return result;
  });

  return config;
}

module.exports = withInstagramSharing;