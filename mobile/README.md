# Deployment Playground — React Native Mobile Client

A lightweight, high-performance React Native mobile application built with Expo and TypeScript, providing identical functionality to the Next.js web frontend.

---

## Features

1. **Lightweight React Native**:
   - Built with Expo SDK and TypeScript.
   - Zero bulky native dependencies; relies on core React Native components (`View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `SafeAreaView`, `StatusBar`, `StyleSheet`).

2. **Full Parity with Web Frontend**:
   - **Service Status Monitoring**: Live connectivity checks for Express REST API, Supabase (PostgreSQL), MongoDB, and Redis (Cache).
   - **Single & Bulk Status Checks**: Individual "Check" buttons and a "Check All" button with response latency in milliseconds.
   - **Multi-Database Demonstration**: Submit entries directly to Supabase (`demo_entries`), MongoDB (`demo_entries`), and Redis cache (`demo:playground:latest_entry`).
   - **Live Stored Records**: Tabbed viewer displaying recent rows/docs/cache keys from all three datastores with manual Refresh buttons and auto-fetch on mount.

3. **Automatic Mobile Name Concatenation**:
   - When a user inputs a name (e.g. `Ada Lovelace`), the mobile client automatically formats and appends the `(Mobile)` tag when sending (e.g. `Ada Lovelace (Mobile)`).
   - Features a live preview banner showing the exact formatted string that will be sent to the databases.
   - Enforces strict validation (1–50 max total length, profanity filter, obfuscation detection, non-empty check).

4. **Multi-Environment Connectivity**:
   - Includes an inline **Server Settings** panel in the Header with presets:
     - **LAN (Wi-Fi)**: `http://192.168.1.79:5000` (for testing on physical mobile phones via Expo Go)
     - **Localhost**: `http://localhost:5000` (for web preview and iOS simulator)
     - **Android Emulator**: `http://10.0.2.2:5000`
     - Custom input field with instant "Ping" health check button.

---

## Quick Start

### 1. Start the Mobile Client
From the repository root:
```bash
npm run dev:mobile
```
Or inside the `mobile` folder:
```bash
npm start
```

### 2. View in Browser (Web Preview)
```bash
npm run dev:mobile:web
```
Or press `w` in the Expo terminal window.

### 3. View on Physical Device (iOS / Android)
1. Install **Expo Go** from the App Store or Google Play.
2. Scan the QR code displayed in your terminal using the camera (iOS) or Expo Go app (Android).
3. Ensure your phone is connected to the same Wi-Fi network as your computer (`192.168.1.79`).

### 4. Run Mobile Unit & Validation Tests
```bash
npm run test:validation:mobile
```
Or from the `mobile` folder:
```bash
npm run test:validation
```

---

## Directory Structure
```
mobile/
├── assets/                  # App icon and adaptive assets
├── src/
│   ├── components/
│   │   ├── Header.tsx                   # Top bar & server switcher
│   │   ├── ServiceStatusSection.tsx     # Status cards for 4 services
│   │   └── DatabasePlaygroundSection.tsx# Name input, (Mobile) preview, DB actions & records
│   ├── apiClient.ts         # HTTP requests with timeout & error handling
│   ├── config.ts            # Network IP detection and environment presets
│   ├── nameValidator.ts     # Validation rules and (Mobile) formatter
│   ├── profanityList.ts     # Profanity & obfuscation filter list
│   └── types.ts             # TypeScript interface definitions
├── App.tsx                  # Main application screen
├── app.json                 # Expo project configuration
├── package.json             # Project dependencies & scripts
├── testValidator.ts         # Validation test suite
└── tsconfig.json            # TypeScript configuration
```
