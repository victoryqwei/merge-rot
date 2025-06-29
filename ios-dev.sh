#!/bin/bash

# iOS Development Helper Script for Merge Rot

echo "🚀 Merge Rot iOS Development Helper"
echo "=================================="

case "$1" in
  "build")
    echo "📦 Building web app..."
    npm run build
    echo "✅ Web app built successfully"
    ;;
    
  "sync")
    echo "🔄 Syncing web app to iOS..."
    npx cap sync ios
    echo "✅ iOS project synced"
    ;;
    
  "open")
    echo "📱 Opening in Xcode..."
    npx cap open ios
    ;;
    
  "run")
    echo "🏃 Running on iOS simulator..."
    npx cap run ios
    ;;
    
  "dev")
    echo "🔄 Full development workflow..."
    echo "1. Building web app..."
    npm run build
    echo "2. Syncing to iOS..."
    npx cap sync ios
    echo "3. Opening in Xcode..."
    npx cap open ios
    echo "✅ Ready to test in Xcode!"
    ;;
    
  "setup")
    echo "🔧 Setting up iOS development environment..."
    echo "Please make sure you have:"
    echo "1. Xcode installed from Mac App Store"
    echo "2. CocoaPods installed (sudo gem install cocoapods)"
    echo "3. Apple Developer account"
    echo ""
    echo "Then run: ./ios-dev.sh dev"
    ;;
    
  *)
    echo "Usage: ./ios-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build  - Build the web app"
    echo "  sync   - Sync web app to iOS"
    echo "  open   - Open in Xcode"
    echo "  run    - Run on iOS simulator"
    echo "  dev    - Full development workflow (build + sync + open)"
    echo "  setup  - Show setup instructions"
    echo ""
    echo "Example: ./ios-dev.sh dev"
    ;;
esac 