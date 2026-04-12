import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function AuthGroupLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#fff9e3" },
      }}
    />
  );
}
