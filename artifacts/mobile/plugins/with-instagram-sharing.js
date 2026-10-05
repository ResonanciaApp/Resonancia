const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const SHARE_PACKAGES = ["com.instagram.android", "com.whatsapp", "com.facebook.orca"];
const SHARE_SCHEMES = ["instagram-stories", "instagram", "whatsapp"];

function withInstagramSharing(config) {
  config = withInfoPlist(config, (result) => {
    const schemes = result.modResults.LSApplicationQueriesSchemes ?? [];
    result.modResults.LSApplicationQueriesSchemes = [...new Set([...schemes, ...SHARE_SCHEMES])];
    return result;
  });

  config = withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    const queries = manifest.queries ?? [{}];
    const firstQuery = queries[0] ?? {};
    const packages = firstQuery.package ?? [];
    firstQuery.package = [
      ...packages,
      ...SHARE_PACKAGES.filter((name) => !packages.some((entry) => entry.$?.["android:name"] === name))
        .map((name) => ({ $: { "android:name": name } })),
    ];
    queries[0] = firstQuery;
    manifest.queries = queries;
    return result;
  });

  return config;
}

module.exports = withInstagramSharing;