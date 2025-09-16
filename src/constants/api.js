// export const SERVER_URL = "http://192.168.1.4:3000";                            //Development
// export const SERVER_URL = "https://bookworm-backend-staging-0pz3.onrender.com";     //StAGING
export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URLS;                   // PROD
// export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URLS_STAGING;          //STAGING
export const GOOGLE_BOOKS_API_URL =
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_URLS ??
  "https://www.googleapis.com/books/v1/volumes";
export const BOOKS_API_KEY = process.env.EXPO_PUBLIC_BOOKS_API_KEYS;
export const APP_VERSION = "1.5";
export const PRIVACY_POLICY =
  "https://www.notion.so/Privacy-Policy-21d51c53d35580bd9fefe287981f302b?source=copy_link";
export const TERMS_N_CONDITIONS =
  "https://www.notion.so/Terms-Conditions-21d51c53d35580e6a99bf05580c4aadc?source=copy_link";
export const SHARE_PREFIX = "https://bookworm.infodata.in";




//staging-backend: https://bookworm-backend-staging-0pz3.onrender.com