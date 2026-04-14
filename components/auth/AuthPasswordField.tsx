import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

type AuthPasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
};

export function AuthPasswordField({
  label,
  value,
  onChangeText,
  placeholder = "Enter your password",
  error,
  autoComplete = "password",
  textContentType = "password",
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.35)"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          textAlignVertical="center"
          className={clsx("auth-input pr-14", error && "auth-input-error")}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          onPress={() => setVisible((v) => !v)}
          className="absolute right-3 top-0 bottom-0 justify-center"
          hitSlop={8}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="rgba(8,17,38,0.45)"
          />
        </Pressable>
      </View>
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}
