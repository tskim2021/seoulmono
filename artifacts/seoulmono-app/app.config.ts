import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "seoulmono",
  slug: "seoulmono-app",
  extra: {
    eas: {
      projectId: "64572a66-5a0e-40b7-9f90-a8aecfabfae9",
    },
    domain:
      process.env.EXPO_PUBLIC_DOMAIN ||
      process.env.REPLIT_DEV_DOMAIN ||
      "seoulmono.com",
  },
});
