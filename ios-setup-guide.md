# iOS Release Guide for Merge Rot

## Option 1: React Native Conversion (Recommended)

### Prerequisites

1. Install Xcode from the Mac App Store
2. Install Node.js (you already have this)
3. Install React Native CLI:
   ```bash
   npm install -g @react-native-community/cli
   ```

### Step 1: Create React Native Project

```bash
npx react-native@latest init MergeRot --template react-native-template-typescript
cd MergeRot
```

### Step 2: Install Dependencies

Based on your current dependencies, you'll need to install React Native equivalents:

```bash
npm install @react-native-async-storage/async-storage
npm install react-native-sound
npm install react-native-vector-icons
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install react-native-safe-area-context
npm install react-native-screens
```

### Step 3: Convert Components

You'll need to convert your React components to use React Native components:

- Replace `div` with `View`
- Replace `img` with `Image`
- Replace `button` with `TouchableOpacity` or `Pressable`
- Replace CSS with StyleSheet

### Step 4: Handle Platform-Specific Code

- Replace `howler` with `react-native-sound`
- Replace `matter-js` with `react-native-matter` or a React Native physics library
- Adapt Chakra UI components to React Native equivalents

### Step 5: Build and Test

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Run on iOS Simulator
npx react-native run-ios

# Run on physical device
npx react-native run-ios --device
```

### Step 6: Prepare for App Store

1. Configure app icons and splash screens
2. Set up app signing in Xcode
3. Configure app permissions
4. Test thoroughly on physical devices
5. Submit to App Store Connect

## Option 2: Progressive Web App (PWA)

If you want to keep your current web app and make it installable on iOS:

### Step 1: Add PWA Configuration

Create a `manifest.json` file in your `public` directory:

```json
{
  "name": "Merge Rot",
  "short_name": "MergeRot",
  "description": "A merge puzzle game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 2: Add Service Worker

Create a service worker for offline functionality.

### Step 3: Deploy to Web

Deploy your PWA to a hosting service (Netlify, Vercel, etc.)

### Step 4: iOS Users Can Install

Users can add your PWA to their home screen via Safari's "Add to Home Screen" feature.

## Option 3: Capacitor (Hybrid App)

Convert your web app to a native iOS app using Capacitor:

### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npx cap init
```

### Step 2: Build Your Web App

```bash
npm run build
```

### Step 3: Add iOS Platform

```bash
npx cap add ios
npx cap sync
```

### Step 4: Open in Xcode

```bash
npx cap open ios
```

### Step 5: Configure and Build

- Configure app icons and splash screens
- Set up app signing
- Build and test on device
- Submit to App Store

## Recommendation

For the best user experience and full access to iOS features, I recommend **Option 1 (React Native)**. However, if you want to get to market quickly with minimal changes, **Option 3 (Capacitor)** would be the fastest path.

Would you like me to help you implement any of these options?
