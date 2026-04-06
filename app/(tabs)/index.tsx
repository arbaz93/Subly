import "@/global.css";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
const SafeAreaView = styled(RNSafeAreaView)

export default function App() {
    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="text-5xl font-sans-extrabold ">
                Home
            </Text>
            <Link href="/settings" className="mt-4 font-sans-bold bg-primary rounded text-white p-4">settings</Link>
            <Link href="/(auth)/sign-up" className="mt-4 font-sans-bold bg-primary rounded text-white p-4">Sign up</Link>

        </SafeAreaView>
    );
}