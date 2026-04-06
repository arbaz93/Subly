import { Link } from 'expo-router'
import { Text, View } from 'react-native'

const SignIn = () => {
  return (
    <View className='flex-1 bg-background items-center justify-center'>
      <Text>Sign In</Text>
      <Link href="/(auth)/sign-up">Don't have an account? <Text className='text-blue-500'>Sign Up</Text></Link>
    </View>
  )
}

export default SignIn