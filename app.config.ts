import { ExpoConfig } from 'expo/config';

const defineConfig = (): ExpoConfig => ({
  name: 'picnic-map',
  slug: 'picnic-map',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Votre position est utilisée pour centrer la carte et proposer des lieux proches.',
      NSPhotoLibraryUsageDescription:
        'Accès à la photothèque pour joindre des photos aux lieux.',
      NSCameraUsageDescription:
        'Accès à la caméra pour prendre des photos des lieux.',
      NSUserNotificationsUsageDescription:
        'Recevez des notifications pour les nouvelles activités et rappels.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    'expo-secure-store',
    'expo-notifications',
  ],
  notification: {
    color: '#4CAF50',
    iosDisplayInForeground: true,
    androidMode: 'default',
    androidCollapsedTitle: 'Nouveau lieu ajouté',
  },
});

export default defineConfig;


