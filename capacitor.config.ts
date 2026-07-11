import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.udhari.app',
  appName: 'Udhari',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
