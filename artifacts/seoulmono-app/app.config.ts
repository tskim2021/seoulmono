import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ソウルモノ",
  slug: "seoulmono-app",
  extra: {
    ...config.extra,
    domain:
      process.env.EXPO_PUBLIC_DOMAIN ||
      process.env.REPLIT_DEV_DOMAIN ||
      "seoulmono.com",
  },
});
