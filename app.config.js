module.exports = {
  expo: {
    name: "BudgetZen",
    slug: "my-money",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mymoney",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.budgetzen.app",
      supportsTablet: true
    },
    android: {
      package: "com.budgetzen.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./android/app/google-services.json",
      newArchEnabled: true,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-font",
      "expo-secure-store",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "05a6caea-ca34-4e6e-ab47-6ddd44d60aba"
      }
    },
    owner: "john-prabu-a"
  }
};
