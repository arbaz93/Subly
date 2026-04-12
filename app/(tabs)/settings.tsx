import clsx from "clsx";
import { styled } from "nativewind";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import images from "@/constants/images";
import { useSettings } from "@/lib/useSettings";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const {
    user,
    isLoaded,
    email,
    currentAvatarUrl,
    signingOut,
    avatarError,
    savingAvatar,
    pickedImage,
    isCropMode,
    CROP_BOX_SIZE,
    composedGesture,
    animatedStyle,
    onSignOut,
    onPickImage,
    onConfirmCrop,
    onCancelCrop,
  } = useSettings();

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Text className="list-title">Settings</Text>

        {isLoaded ? (
          <>
            <View className="mt-6 rounded-3xl border border-border bg-card p-5">
              <Text className="text-sm font-sans-semibold text-muted-foreground">Signed in as</Text>
              <Text className="mt-1 text-lg font-sans-bold text-primary">
                {user?.fullName?.trim() || email || "Your account"}
              </Text>
              {email ? (
                <Text className="mt-1 text-base font-sans-medium text-muted-foreground">{email}</Text>
              ) : null}
            </View>

            <View className="mt-5 rounded-3xl border border-border bg-card p-5">
              <Text className="text-lg font-sans-bold text-primary">Profile photo</Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                Upload a photo from your device to update your avatar.
              </Text>

              <View className="mt-6 flex-row items-center gap-6">
                <Image
                  source={currentAvatarUrl ? { uri: currentAvatarUrl } : images.avatar}
                  className="size-20 rounded-full border border-border"
                />
                <View className="flex-1">
                  <Pressable
                    onPress={onPickImage}
                    disabled={savingAvatar}
                    className={clsx(
                      "flex-row items-center justify-center rounded-xl bg-primary py-3",
                      savingAvatar && "opacity-50",
                    )}
                  >
                    <Text className="text-sm font-sans-bold text-white">Choose Image</Text>
                  </Pressable>
                  {avatarError ? <Text className="auth-error mt-2">{avatarError}</Text> : null}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#081126" />
          </View>
        )}

        <Pressable
          onPress={onSignOut}
          disabled={signingOut || !isLoaded}
          className={clsx("sub-cancel mt-8", signingOut && "sub-cancel-disabled")}
        >
          {signingOut ? (
            <ActivityIndicator color="#fff9e3" />
          ) : (
            <Text className="sub-cancel-text">Sign out</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Crop Mode Modal */}
      <Modal visible={isCropMode} animationType="slide">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-1 items-center justify-center">
              <Text className="mb-8 text-2xl font-sans-bold text-primary">Crop Photo</Text>
              
              <View 
                style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
                className="relative overflow-hidden rounded-full border-2 border-primary bg-black shadow-lg items-center justify-center"
              >
                {pickedImage && (
                  <GestureDetector gesture={composedGesture}>
                    <Animated.View style={animatedStyle}>
                      <Image
                        source={{ uri: pickedImage.uri }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </Animated.View>
                  </GestureDetector>
                )}
                {/* Visual Circle Overlay */}
                <View 
                  pointerEvents="none" 
                  className="absolute inset-0 rounded-full border-2 border-white/20" 
                />
              </View>

              <Text className="mt-6 px-4 text-center text-sm font-sans-medium text-muted-foreground">
                Pinch to zoom and drag to move.
              </Text>
            </View>

            <View className="flex-row gap-4 pb-10">
              <Pressable
                onPress={onCancelCrop}
                disabled={savingAvatar}
                className="flex-1 items-center justify-center rounded-2xl border border-border bg-white py-4"
              >
                <Text className="text-base font-sans-bold text-primary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onConfirmCrop}
                disabled={savingAvatar}
                className="flex-1 items-center justify-center rounded-2xl bg-primary py-4"
              >
                {savingAvatar ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">Select</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;
