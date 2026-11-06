import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bujo.app',
  appName: 'BuJón',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
