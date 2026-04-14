import { useAuth, useSignIn } from "@clerk/expo";
import { Link, router } from "expo-router";
import * as Haptics from "expo-haptics";
import clsx from "clsx";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

import { AuthBrandBlock } from "@/components/auth/AuthBrandBlock";
import { AuthPasswordField } from "@/components/auth/AuthPasswordField";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { mapAuthError } from "@/lib/auth-errors";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/auth-validation";
import { posthog } from "@/lib/posthog";

const StyledSafeArea = styled(SafeAreaView);

export default function ResetPasswordScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<"email" | "newPassword">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [emailError, setEmailError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = useCallback(async () => {
    setApiError(null);
    const eErr = validateEmail(email);
    setEmailError(eErr ?? undefined);
    if (eErr) return;

    setBusy(true);
    try {
      await signIn.reset();

      const { error: c1 } = await signIn.create({
        identifier: email.trim(),
      });
      if (c1) {
        setApiError(mapAuthError(c1));
        return;
      }

      const { error: c2 } = await signIn.resetPasswordEmailCode.sendCode();
      if (c2) {
        setApiError(mapAuthError(c2));
        return;
      }

      posthog.capture("password_reset_requested");
      setStep("newPassword");
    } finally {
      setBusy(false);
    }
  }, [email, signIn]);

  const submitNewPassword = useCallback(async () => {
    setApiError(null);
    setCodeError(undefined);
    const pErr = validatePassword(password);
    const cErr = validatePasswordConfirm(password, confirm);
    setPasswordError(pErr ?? undefined);
    setConfirmError(cErr ?? undefined);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setCodeError("Enter the code from your email.");
    }

    if (pErr || cErr || !trimmedCode) return;

    setBusy(true);
    try {
      const { error: vErr } = await signIn.resetPasswordEmailCode.verifyCode({
        code: trimmedCode,
      });
      if (vErr) {
        setApiError(mapAuthError(vErr));
        return;
      }

      const { error: sErr } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (sErr) {
        setApiError(mapAuthError(sErr));
        return;
      }

      if (signIn.status === "complete" && signIn.createdSessionId) {
        const { error: fErr } = await signIn.finalize();
        if (fErr) {
          setApiError(mapAuthError(fErr));
          return;
        }
        posthog.capture("password_reset_completed");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
        return;
      }

      setApiError("Password was updated but we could not sign you in automatically. Try signing in.");
    } finally {
      setBusy(false);
    }
  }, [code, confirm, password, signIn]);

  if (!authLoaded || isSignedIn) {
    return null;
  }

  const fetching = fetchStatus === "fetching" || busy;

  return (
    <StyledSafeArea className="auth-safe-area" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="auth-content"
          showsVerticalScrollIndicator={false}
        >
          <AuthBrandBlock
            title="Reset password"
            subtitle="We’ll email you a short code. Choose a strong new password when you’re ready."
          />

          <View className="auth-card">
            {step === "email" ? (
              <View className="auth-form">
                <AuthTextField
                  label="Email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setEmailError(undefined);
                  }}
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={emailError}
                />

                {apiError ? (
                  <Text className="auth-error text-center">{apiError}</Text>
                ) : null}

                <Pressable
                  onPress={sendCode}
                  disabled={fetching}
                  className={clsx("auth-button", fetching && "auth-button-disabled")}
                >
                  {fetching ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Send reset code</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View className="auth-form">
                <Text className="auth-helper text-center">
                  Check {email.trim()} for your code, then set a new password.
                </Text>

                <AuthTextField
                  label="Reset code"
                  value={code}
                  onChangeText={(t) => {
                    setCode(t);
                    setCodeError(undefined);
                  }}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  error={codeError}
                />

                <AuthPasswordField
                  label="New password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError(undefined);
                  }}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  error={passwordError}
                />

                <AuthPasswordField
                  label="Confirm new password"
                  value={confirm}
                  onChangeText={(t) => {
                    setConfirm(t);
                    setConfirmError(undefined);
                  }}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  error={confirmError}
                />

                {apiError ? (
                  <Text className="auth-error text-center">{apiError}</Text>
                ) : null}

                <Pressable
                  onPress={submitNewPassword}
                  disabled={fetching}
                  className={clsx("auth-button", fetching && "auth-button-disabled")}
                >
                  {fetching ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Update password</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setStep("email");
                    setCode("");
                    setPassword("");
                    setConfirm("");
                    setApiError(null);
                  }}
                  className="auth-link-row"
                >
                  <Text className="auth-link-copy">Use a different email?</Text>
                  <Text className="auth-link">Go back</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="auth-link-row">
            <Link href="/sign-in" asChild>
              <Pressable>
                <Text className="auth-link">Back to sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeArea>
  );
}
