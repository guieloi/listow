// Carrega variáveis de ambiente do arquivo .env se existir
try {
  require('dotenv').config();
} catch (e) {
  // dotenv não disponível ou arquivo .env não encontrado - usa variáveis de ambiente do sistema
}

module.exports = {
  expo: {
    name: "listow",
    slug: "listow",
    scheme: "listow",
    version: "0.0.1",
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
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "952ef910-9741-4fe8-ac92-2f2acde007e7"
      },
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "278950160388-9iavu1duamc7lofv9a34a356a5dm6637.apps.googleusercontent.com",
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://app.grupoigl.online/api"
    },
    plugins: [
      "expo-web-browser",
      "@react-native-google-signin/google-signin"
    ]
  }
};

