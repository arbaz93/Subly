import type { SignInFutureResource } from "@clerk/expo/types";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { mapAuthError } from "@/lib/auth-errors";

import { AuthTextField } from "./AuthTextField";

type MfaChallengeProps = {
  signIn: SignInFutureResource;
  onComplete: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
};

export function MfaChallenge({
  signIn,
  onComplete,
  busy,
  setBusy,
}: MfaChallengeProps) {
  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [phoneSent, setPhoneSent] = useState(false);

  const mode = useMemo(() => {
    const factors = signIn.supportedSecondFactors ?? [];
    if (factors.some((f) => f.strategy === "totp")) return "totp" as const;
    if (factors.some((f) => f.strategy === "phone_code")) return "phone_code" as const;
    if (factors.some((f) => f.strategy === "email_code")) return "email_code" as const;
    if (factors.some((f) => f.strategy === "backup_code")) return "backup_code" as const;
    return "unknown" as const;
  }, [signIn.supportedSecondFactors]);

  const sendPhone = useCallback(async () => {
    setApiError(null);
    setBusy(true);
    try {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) {
        setApiError(mapAuthError(error));
        return;
      }
      setPhoneSent(true);
    } finally {
      setBusy(false);
    }
  }, [setBusy, signIn.mfa]);

  const sendEmail = useCallback(async () => {
    setApiError(null);
    setBusy(true);
    try {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) setApiError(mapAuthError(error));
    } finally {
      setBusy(false);
    }
  }, [setBusy, signIn.mfa]);

  const submit = useCallback(async () => {
    setApiError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setApiError("Enter the verification code.");
      return;
    }
    setBusy(true);
    try {
      let error = null;
      if (mode === "totp") {
        ({ error } = await signIn.mfa.verifyTOTP({ code: trimmed }));
      } else if (mode === "phone_code") {
        ({ error } = await signIn.mfa.verifyPhoneCode({ code: trimmed }));
      } else if (mode === "email_code") {
        ({ error } = await signIn.mfa.verifyEmailCode({ code: trimmed }));
      } else if (mode === "backup_code") {
        ({ error } = await signIn.mfa.verifyBackupCode({ code: trimmed }));
      } else {
        setApiError("This account needs an extra sign-in step we don’t support in the app yet.");
        return;
      }
      if (error) {
        setApiError(mapAuthError(error));
        return;
      }
      const { error: finErr } = await signIn.finalize();
      if (finErr) {
        setApiError(mapAuthError(finErr));
        return;
      }
      onComplete();
    } finally {
      setBusy(false);
    }
  }, [code, mode, onComplete, setBusy, signIn]);

  const helper =
    mode === "totp"
      ? "Open your authenticator app and enter the 6-digit code."
      : mode === "phone_code"
        ? "We’ll text a code to the number on your account."
        : mode === "email_code"
          ? "We’ll email a code to the address on your account."
          : mode === "backup_code"
            ? "Enter one of your saved backup codes."
            : "Additional verification is required for this account.";

  return (
    <View className="auth-form">
      <Text className="auth-helper text-center">{helper}</Text>

      {mode === "phone_code" && !phoneSent ? (
        <Pressable
          onPress={sendPhone}
          disabled={busy}
          className={clsx("auth-secondary-button", busy && "opacity-50")}
        >
          <Text className="auth-secondary-button-text">Text me a code</Text>
        </Pressable>
      ) : null}

      {mode === "email_code" ? (
        <Pressable
          onPress={sendEmail}
          disabled={busy}
          className={clsx("auth-secondary-button", busy && "opacity-50")}
        >
          <Text className="auth-secondary-button-text">Email me a code</Text>
        </Pressable>
      ) : null}

      {(mode !== "phone_code" || phoneSent) && mode !== "unknown" ? (
        <AuthTextField
          label={
            mode === "totp"
              ? "Authenticator code"
              : mode === "backup_code"
                ? "Backup code"
                : "Verification code"
          }
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="off"
        />
      ) : null}

      {apiError ? <Text className="auth-error text-center">{apiError}</Text> : null}

      {(mode !== "phone_code" || phoneSent) && mode !== "unknown" ? (
        <Pressable
          onPress={submit}
          disabled={busy}
          className={clsx("auth-button", busy && "auth-button-disabled")}
        >
          <Text className="auth-button-text">Verify and continue</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
