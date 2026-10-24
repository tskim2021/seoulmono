export const ENV = {
  appId: process.env.VITE_APP_ID ?? "talmoschool",
  cookieSecret: process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "default-dev-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  seventeentrackApiKey: process.env.SEVENTEENTRACK_API_KEY ?? "",
  koreaPostApiKey: process.env.KOREA_POST_API_KEY ?? "",
};

