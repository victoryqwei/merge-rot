# iOS Setup Steps for Merge Rot

## ✅ Completed Steps

- ✅ Capacitor initialized
- ✅ iOS platform added
- ✅ Web app built
- ✅ iOS project structure created

## 🔄 Next Steps Required

### 1. Install Xcode (Required)

1. Open the Mac App Store
2. Search for "Xcode"
3. Download and install Xcode (this will take a while - it's several GB)
4. After installation, open Xcode once to accept the license agreement

### 2. Install CocoaPods (Required)

```bash
sudo gem install cocoapods
```

### 3. Complete iOS Setup

Once Xcode and CocoaPods are installed, run:

```bash
npx cap sync ios
```

### 4. Open in Xcode

```bash
npx cap open ios
```

### 5. Configure App in Xcode

In Xcode, you'll need to:

#### A. Set App Bundle Identifier

- Select the project in the navigator
- Select the "App" target
- In "General" tab, change Bundle Identifier to something unique like:
  `com.yourname.mergerot`

#### B. Configure App Icons

- In the "General" tab, find "App Icons Source"
- Click on the arrow next to "AppIcon"
- Add your app icons in various sizes (20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024)

#### C. Configure Launch Screen

- In the "General" tab, find "Launch Screen"
- Create a launch screen storyboard or use the default

#### D. Set App Permissions

If your app needs any of these, add them to Info.plist:

- Camera access
- Microphone access
- Location access
- Photo library access

### 6. Test on Simulator

1. In Xcode, select a simulator (e.g., iPhone 15)
2. Click the "Run" button (▶️)
3. Your app should launch in the simulator

### 7. Test on Physical Device

1. Connect your iPhone via USB
2. In Xcode, select your device from the device list
3. You may need to:
   - Trust your developer certificate on your iPhone
   - Add your Apple ID to Xcode
   - Configure code signing

### 8. Prepare for App Store

#### A. Create App Store Connect Account

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Create a new app entry

#### B. Configure App Metadata

- App name: "Merge Rot"
- Subtitle: Brief description
- Keywords: Relevant search terms
- Description: Detailed app description
- Screenshots: Take screenshots from simulator/device
- App icon: 1024x1024 PNG

#### C. Set Up Code Signing

1. In Xcode, go to "Signing & Capabilities"
2. Select your team (Apple Developer account)
3. Let Xcode manage signing automatically

#### D. Archive and Upload

1. In Xcode, select "Any iOS Device" as the target
2. Go to Product → Archive
3. Once archived, click "Distribute App"
4. Choose "App Store Connect"
5. Follow the upload process

### 9. Submit for Review

1. In App Store Connect, complete all required metadata
2. Upload your build
3. Submit for review

## 🎯 Quick Start Commands

After installing Xcode and CocoaPods:

```bash
# Sync your web app changes to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and run on simulator
npx cap run ios
```

## 📱 App Store Requirements Checklist

- [ ] App icon in all required sizes
- [ ] Launch screen configured
- [ ] App name and description
- [ ] Screenshots for different device sizes
- [ ] Privacy policy (if collecting user data)
- [ ] App Store Connect account
- [ ] Apple Developer Program membership ($99/year)
- [ ] Code signing configured
- [ ] App tested on physical device
- [ ] All app store guidelines followed

## 🚀 Alternative: TestFlight Beta

Before submitting to the App Store, you can:

1. Upload your app to TestFlight
2. Invite beta testers
3. Get feedback and fix issues
4. Then submit to the App Store

## 💡 Tips

1. **Start with TestFlight** - It's easier to get approved and you can iterate quickly
2. **Test thoroughly** - iOS users expect polished apps
3. **Follow Apple's guidelines** - Read the App Store Review Guidelines
4. **Optimize performance** - iOS users are sensitive to battery drain and performance
5. **Handle offline mode** - Consider what happens when users lose connection

## 🆘 Common Issues

- **Code signing errors**: Make sure your Apple Developer account is active
- **Build errors**: Check that all dependencies are properly installed
- **Simulator issues**: Try resetting the simulator (Device → Erase All Content and Settings)
- **Device testing**: Make sure your device is trusted and unlocked

Need help with any specific step? Let me know!
