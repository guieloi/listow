const fs = require('fs');
const path = require('path');

// Load environment variables when available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available - rely on process.env
}

const googleServicesPath = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
const resolvedGoogleServicesPath = path.resolve(__dirname, googleServicesPath);
const hasGoogleServices = fs.existsSync(resolvedGoogleServicesPath);

module.exports = {
  expo: {
    name: "listow",
    slug: "listow",
    scheme: "listow",
    version: "0.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F0D9FA"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.guieloi.listow"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F0D9FA"
      },
      package: "com.guieloi.listow",
      ...(hasGoogleServices ? { googleServicesFile: googleServicesPath } : {}),
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "952ef910-9741-4fe8-ac92-2f2acde007e7"
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://app.grupoigl.online/api",
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "guieloi1989@gmail.com"
    },
    plugins: [
      "expo-web-browser",
      "expo-notifications"
    ]
  }
};
