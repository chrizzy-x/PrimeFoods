/// <reference types="react-native" />

// Expo injects these at build time via Babel
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL: string | undefined;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
