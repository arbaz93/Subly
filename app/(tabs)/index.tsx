import "@/global.css";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
const SafeAreaView = styled(RNSafeAreaView)

export default function App() {
    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="text-3xl font-bold text-center text-gray-700 ">
                Welcome to the AI Subscription App!
            </Text>

            <Link href="/settings" className="mt-4 bg-primary rounded text-white p-4">settings</Link>
            <Link href="/(auth)/sign-up" className="mt-4 bg-primary rounded text-white p-4">Sign up</Link>
            <Link href="/subscriptions/spotify" className="mt-4 bg-primary rounded text-white p-4">Subscribe to Spotify</Link>
            <Link href={{
                pathname: "/subscriptions/[id]",
                params: { id: "claude" }
            }} className="mt-4 bg-primary rounded text-white p-4">Subscribe to Claude</Link>


        </SafeAreaView>
    );
}