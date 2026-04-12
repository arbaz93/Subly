import clsx from "clsx";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  editable?: boolean;
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete = "off",
  textContentType,
  editable = true,
}: AuthTextFieldProps) {
  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={editable}
        textAlignVertical="center"
        className={clsx("auth-input", error && "auth-input-error")}
      />
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}
