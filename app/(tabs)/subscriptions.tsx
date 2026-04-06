import { Text, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
const SafeAreaView = styled(RNSafeAreaView)

export default function Subscriptions() {
  return (
    <SafeAreaView>
      <Text>Subscriptions</Text>
    </SafeAreaView>
  )
}