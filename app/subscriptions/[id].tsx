import { Link, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

const SubscriptionDetails = () => {
    const { id, foos } = useLocalSearchParams<{id: string, foos: any}>()
  return (
    <View className='flex-1 bg-background items-center justify-center'>
      <Text>SubscriptionDetails {id}</Text>
      <Link href="/" className="mt-4 bg-primary rounded text-white p-4">Home</Link>
    </View>
  )
}

export default SubscriptionDetails