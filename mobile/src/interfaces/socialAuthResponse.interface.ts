export interface SocialAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    thumbnail?: string;
  };
}
