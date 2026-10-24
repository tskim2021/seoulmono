const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Monorepo: include workspace root so cross-package imports resolve
const workspaceRoot = path.resolve(__dirname, "../..");
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Block pnpm virtual-store tmp directories so Metro's FallbackWatcher
// does not crash when those paths disappear between crawl and watch().
config.resolver.blockList = [
  /node_modules[/\\]\.pnpm[/\\].*_tmp_.*[/\\].*/,
  /local-maven-repo[/\\].*/,
  /\.local[/\\].*/,
];

module.exports = config;
