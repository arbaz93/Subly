import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { 
  useAnimatedStyle, 
  useSharedValue, 
  useDerivedValue,
} from "react-native-reanimated";

import { mapAuthError } from "@/lib/auth-errors";
import { posthog } from "@/lib/posthog";

export const useSettings = () => {
  const { width: windowWidth } = useWindowDimensions();
  const CROP_BOX_SIZE = windowWidth - 48; // p-6 on each side

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  const [signingOut, setSigningOut] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [pickedImage, setPickedImage] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);

  // Shared values for transformation
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Origins for pinch focal point logic
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  // Temporary trackers for gesture start states
  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  const onSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      posthog.capture("user_signed_out");
      posthog.reset();
      await signOut();
      router.replace("/sign-in");
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  // Derived display dimensions (aspect fit base)
  const displayDims = useDerivedValue(() => {
    if (!pickedImage) return { w: CROP_BOX_SIZE, h: CROP_BOX_SIZE, minScale: 1 };
    const aspect = pickedImage.width / pickedImage.height;
    let w, h;
    if (aspect > 1) {
      w = CROP_BOX_SIZE * aspect;
      h = CROP_BOX_SIZE;
    } else {
      w = CROP_BOX_SIZE;
      h = CROP_BOX_SIZE / aspect;
    }
    // With resizeMode="cover" (or full view size), scale 1.0 already covers the box
    return { w, h, minScale: 1.0 };
  });

  const onPickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const { uri, width, height } = result.assets[0];
      setPickedImage({ uri, width, height });
      setIsCropMode(true);
      setAvatarError(null);
      
      scale.value = 1.0;
      translateX.value = 0;
      translateY.value = 0;
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const { w, h } = displayDims.value;
      const currentW = w * scale.value;
      const currentH = h * scale.value;
      
      // Calculate strict boundaries
      const maxTranslateX = Math.max(0, (currentW - CROP_BOX_SIZE) / 2);
      const maxTranslateY = Math.max(0, (currentH - CROP_BOX_SIZE) / 2);

      const nextX = startTranslateX.value + event.translationX;
      const nextY = startTranslateY.value + event.translationY;

      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, nextX));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, nextY));
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;

      // Focal point relative to image center
      originX.value = event.focalX - CROP_BOX_SIZE / 2;
      originY.value = event.focalY - CROP_BOX_SIZE / 2;
    })
    .onUpdate((event) => {
      const { w, h, minScale } = displayDims.value;
      const newScale = Math.max(minScale, Math.min(startScale.value * event.scale, 5));
      
      const scaleRatio = newScale / startScale.value;
      const nextX = originX.value - (originX.value - startTranslateX.value) * scaleRatio;
      const nextY = originY.value - (originY.value - startTranslateY.value) * scaleRatio;

      scale.value = newScale;

      const currentW = w * newScale;
      const currentH = h * newScale;
      const maxTranslateX = Math.max(0, (currentW - CROP_BOX_SIZE) / 2);
      const maxTranslateY = Math.max(0, (currentH - CROP_BOX_SIZE) / 2);

      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, nextX));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, nextY));
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const { w, h } = displayDims.value;
    return {
      width: w,
      height: h,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const onConfirmCrop = async () => {
    if (!pickedImage || !user) return;

    setSavingAvatar(true);
    try {
      const { w, h } = displayDims.value;
      const finalW = w * scale.value;
      const finalH = h * scale.value;
      const ratio = pickedImage.width / finalW;
      
      // Calculate crop origin relative to image top-left
      const imageLeft = (CROP_BOX_SIZE / 2) - (finalW / 2) + translateX.value;
      const imageTop = (CROP_BOX_SIZE / 2) - (finalH / 2) + translateY.value;
      
      const originX = (0 - imageLeft) * ratio;
      const originY = (0 - imageTop) * ratio;
      const cropSize = CROP_BOX_SIZE * ratio;

      const manipResult = await ImageManipulator.manipulateAsync(
        pickedImage.uri,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: Math.min(pickedImage.width - originX, cropSize),
              height: Math.min(pickedImage.height - originY, cropSize),
            },
          },
          { resize: { width: 500, height: 500 } },
        ],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        const base64 = `data:image/jpeg;base64,${manipResult.base64}`;
        await user.setProfileImage({ file: base64 });
        posthog.capture("profile_photo_updated");
        setPickedImage(null);
        setIsCropMode(false);
      }
    } catch (e) {
      console.error(e);
      setAvatarError(mapAuthError(e));
    } finally {
      setSavingAvatar(false);
    }
  };

  const onCancelCrop = () => {
    setPickedImage(null);
    setIsCropMode(false);
  };

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const currentAvatarUrl = user?.imageUrl;

  return {
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
  };
};
