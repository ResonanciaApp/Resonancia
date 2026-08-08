// CLEAN METRO CONFIG (temporary fix)
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// IMPORTANT: fix monorepo root confusion
config.projectRoot = __dirname;

module.exports = config;

