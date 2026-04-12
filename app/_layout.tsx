import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as WebBrowser from "expo-web-browser";
import { useEffect, type ReactNode } from "react";
import { Text, View } from "react-native";

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

function ClerkReadySplash({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  const { isLoaded: authLoaded } = useAuth();

  useEffect(() => {
    if (fontsLoaded && authLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoaded]);

  if (!fontsLoaded || !authLoaded) {
    return null;
  }

  return children;
}

function MissingPublishableKey() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <View className="auth-safe-area flex-1 items-center justify-center px-8">
      <Text className="text-center text-lg font-sans-semibold text-primary">
        Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment to run Subly.
      </Text>
      <Text className="mt-3 text-center text-base font-sans-medium text-muted-foreground">
        This value is read at build time for Expo; it is not bundled from .env
        inside dependencies.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  if (!publishableKey.trim()) {
    return <MissingPublishableKey />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkReadySplash>
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkReadySplash>
    </ClerkProvider>
  );
}
