import { Platform } from 'react-native';

export const BACKEND_PRESETS = [
  { label: 'LAN (Wi-Fi)', url: 'http://192.168.1.79:5000' },
  { label: 'Localhost', url: 'http://localhost:5000' },
  { label: 'Android Emulator', url: 'http://10.0.2.2:5000' },
];

export function getDefaultBackendUrl(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  // For mobile devices connecting over Wi-Fi
  return 'http://192.168.1.79:5000';
}
