import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import { Link, router, type Href } from "expo-router";
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
import { MfaChallenge } from "@/components/auth/MfaChallenge";
import { mapAuthError } from "@/lib/auth-errors";
import { getOAuthRedirectUrl } from "@/lib/auth-linking";
import { validateEmail, validatePassword } from "@/lib/auth-validation";

const StyledSafeArea = styled(SafeAreaView);

export default function SignInScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");

  const goHome = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }, []);

  const onSubmit = useCallback(async () => {
    setApiError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr ?? undefined);
    setPasswordError(pErr ?? undefined);
    if (eErr || pErr) return;

    setBusy(true);
    try {
      const { error } = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (error) {
        setApiError(mapAuthError(error));
        return;
      }

      if (signIn.status === "needs_second_factor") {
        setStep("mfa");
        return;
      }

      if (signIn.status === "complete" && signIn.createdSessionId) {
        const { error: finErr } = await signIn.finalize();
        if (finErr) {
          setApiError(mapAuthError(finErr));
          return;
        }
        goHome();
        return;
      }

      if (signIn.status === "needs_new_password") {
        setApiError("Your account needs a new password. Use “Forgot password?” below.");
        return;
      }

      setApiError("We could not finish signing you in. Try again or use another method.");
    } finally {
      setBusy(false);
    }
  }, [email, goHome, password, signIn]);

  const onGoogle = useCallback(async () => {
    setApiError(null);
    setBusy(true);
    try {
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: getOAuthRedirectUrl(),
      });
      if (authSessionResult?.type && authSessionResult.type !== "success") {
        return;
      }
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        goHome();
        return;
      }
      setApiError("Google sign-in did not complete. Check your connection and try again.");
    } catch (e) {
      setApiError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }, [goHome, startSSOFlow]);

  if (!authLoaded || isSignedIn) {
    return null;
  }

  const fetching = fetchStatus === "fetching" || busy;
  const primaryDisabled = fetching || step === "mfa";

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
          <View className="auth-shell">
            <AuthBrandBlock
              title="Welcome back"
              subtitle="Sign in to track renewals, spending, and what matters next."
            />

            <View className="auth-card">
              {step === "mfa" ? (
                <MfaChallenge
                  signIn={signIn}
                  onComplete={goHome}
                  busy={busy}
                  setBusy={setBusy}
                />
              ) : (
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

                  <AuthPasswordField
                    label="Password"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setPasswordError(undefined);
                    }}
                    error={passwordError}
                  />

                  <Link href={"/reset-password" as Href} asChild>
                    <Pressable className="self-end">
                      <Text className="auth-link">Forgot password?</Text>
                    </Pressable>
                  </Link>

                  {apiError ? (
                    <Text className="auth-error text-center">{apiError}</Text>
                  ) : null}

                  <Pressable
                    onPress={onSubmit}
                    disabled={primaryDisabled}
                    className={clsx("auth-button", primaryDisabled && "auth-button-disabled")}
                  >
                    {fetching ? (
                      <ActivityIndicator color="#081126" />
                    ) : (
                      <Text className="auth-button-text">Sign in</Text>
                    )}
                  </Pressable>

                  <View className="auth-divider-row">
                    <View className="auth-divider-line" />
                    <Text className="auth-divider-text">or</Text>
                    <View className="auth-divider-line" />
                  </View>

                  <Pressable
                    onPress={onGoogle}
                    disabled={fetching}
                    className={clsx("auth-secondary-button", fetching && "opacity-50")}
                  >
                    <Text className="auth-secondary-button-text">Continue with Google</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {step === "mfa" ? (
              <Pressable
                onPress={async () => {
                  setApiError(null);
                  await signIn.reset();
                  setStep("credentials");
                }}
                className="auth-link-row mt-6"
              >
                <Text className="auth-link-copy">Wrong account?</Text>
                <Text className="auth-link">Start over</Text>
              </Pressable>
            ) : (
              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Subly?</Text>
                <Link href="/sign-up" asChild>
                  <Pressable>
                    <Text className="auth-link">Create an account</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeArea>
  );
}
