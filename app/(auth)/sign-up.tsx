import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { getOAuthRedirectUrl } from "@/lib/auth-linking";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/auth-validation";

const StyledSafeArea = styled(SafeAreaView);

export default function SignUpScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [legalError, setLegalError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goHome = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }, []);

  const finalizeIfComplete = useCallback(async () => {
    if (signUp.status !== "complete" || !signUp.createdSessionId) {
      return false;
    }
    const { error } = await signUp.finalize();
    if (error) {
      setApiError(mapAuthError(error));
      return false;
    }
    goHome();
    return true;
  }, [goHome, signUp]);

  const onCreateAccount = useCallback(async () => {
    setApiError(null);
    setLegalError(undefined);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validatePasswordConfirm(password, confirm);
    setEmailError(eErr ?? undefined);
    setPasswordError(pErr ?? undefined);
    setConfirmError(cErr ?? undefined);

    if (!agreed) {
      setLegalError("Please confirm you agree to continue.");
    }

    if (eErr || pErr || cErr || !agreed) return;

    setBusy(true);
    try {
      const fn = firstName.trim();
      const ln = lastName.trim();
      const { error } = await signUp.create({
        emailAddress: email.trim(),
        password,
        legalAccepted: true,
        ...(fn ? { firstName: fn } : {}),
        ...(ln ? { lastName: ln } : {}),
      });
      if (error) {
        setApiError(mapAuthError(error));
        return;
      }

      if (await finalizeIfComplete()) {
        return;
      }

      if (signUp.status === "missing_requirements") {
        const { error: sendErr } = await signUp.verifications.sendEmailCode();
        if (sendErr) {
          setApiError(mapAuthError(sendErr));
          return;
        }
        setStep("verify");
        return;
      }

      setApiError("We could not finish creating your account. Try again.");
    } finally {
      setBusy(false);
    }
  }, [
    agreed,
    confirm,
    email,
    finalizeIfComplete,
    firstName,
    lastName,
    password,
    signUp,
  ]);

  const onVerifyEmail = useCallback(async () => {
    setApiError(null);
    setCodeError(undefined);
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError("Enter the code from your email.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: trimmed,
      });
      if (error) {
        setApiError(mapAuthError(error));
        return;
      }

      if (await finalizeIfComplete()) {
        return;
      }

      if (signUp.status === "missing_requirements") {
        setApiError("A few more details are required. Open Subly on the web or contact support.");
        return;
      }

      setApiError("Verification did not complete. Request a new code and try again.");
    } finally {
      setBusy(false);
    }
  }, [code, finalizeIfComplete, signUp.verifications, signUp.status, signUp]);

  const onResend = useCallback(async () => {
    setApiError(null);
    setBusy(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) setApiError(mapAuthError(error));
    } finally {
      setBusy(false);
    }
  }, [signUp.verifications]);

  const onGoogle = useCallback(async () => {
    if (!agreed) {
      setLegalError("Please confirm you agree to continue.");
      return;
    }

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

      setApiError("Google sign-up did not complete. Check your connection and try again.");
    } catch (e) {
      setApiError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }, [agreed, goHome, startSSOFlow]);

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
          <View className="auth-shell">
            <AuthBrandBlock
              title="Create your account"
              subtitle="Join Subly to see every subscription in one calm, organized place."
            />

            <View className="auth-card">
              {step === "form" ? (
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
                    autoComplete="password-new"
                    textContentType="newPassword"
                    error={passwordError}
                  />

                  <AuthPasswordField
                    label="Confirm password"
                    value={confirm}
                    onChangeText={(t) => {
                      setConfirm(t);
                      setConfirmError(undefined);
                    }}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    error={confirmError}
                  />

                  <AuthTextField
                    label="First name (optional)"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Alex"
                    autoComplete="name"
                    textContentType="name"
                  />

                  <AuthTextField
                    label="Last name (optional)"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Rivera"
                    autoComplete="name"
                    textContentType="familyName"
                  />

                  <Pressable
                    onPress={() => {
                      setAgreed((v) => !v);
                      setLegalError(undefined);
                    }}
                    className="flex-row items-start gap-3"
                  >
                    <View
                      className={clsx(
                        "mt-0.5 size-6 items-center justify-center rounded-md border-2 border-border",
                        agreed && "border-accent bg-accent/25",
                      )}
                    >
                      {agreed ? (
                        <Ionicons name="checkmark" size={18} color="#081126" />
                      ) : null}
                    </View>
                    <Text className="flex-1 text-sm font-sans-medium leading-5 text-muted-foreground">
                      I agree to Subly&apos;s terms of use and privacy policy.
                    </Text>
                  </Pressable>
                  {legalError ? <Text className="auth-error">{legalError}</Text> : null}

                  {apiError ? (
                    <Text className="auth-error text-center">{apiError}</Text>
                  ) : null}

                  <Pressable
                    onPress={onCreateAccount}
                    disabled={fetching}
                    className={clsx("auth-button", fetching && "auth-button-disabled")}
                  >
                    {fetching ? (
                      <ActivityIndicator color="#081126" />
                    ) : (
                      <Text className="auth-button-text">Create account</Text>
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
              ) : (
                <View className="auth-form">
                  <Text className="auth-helper text-center">
                    Enter the verification code we sent to {email.trim()}.
                  </Text>

                  <AuthTextField
                    label="Email code"
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

                  {apiError ? (
                    <Text className="auth-error text-center">{apiError}</Text>
                  ) : null}

                  <Pressable
                    onPress={onVerifyEmail}
                    disabled={fetching}
                    className={clsx("auth-button", fetching && "auth-button-disabled")}
                  >
                    {fetching ? (
                      <ActivityIndicator color="#081126" />
                    ) : (
                      <Text className="auth-button-text">Verify and continue</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={onResend}
                    disabled={fetching}
                    className={clsx("auth-secondary-button", fetching && "opacity-50")}
                  >
                    <Text className="auth-secondary-button-text">Resend code</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      setApiError(null);
                      await signUp.reset();
                      setStep("form");
                      setCode("");
                    }}
                    className="auth-link-row"
                  >
                    <Text className="auth-link-copy">Wrong email?</Text>
                    <Text className="auth-link">Go back</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {step === "form" ? (
              <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href="/sign-in" asChild>
                  <Pressable>
                    <Text className="auth-link">Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeArea>
  );
}
