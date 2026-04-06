import { Link } from 'expo-router'
import { Text, View } from 'react-native'

const SignUp = () => {
  return (
    <View className='flex-1 bg-background items-center justify-center'>
      <Text>Sign Up</Text>
      <Link href="/(auth)/sign-in">Don't have an account? Sign Up</Link>
    </View>
  )
}

export default SignUp