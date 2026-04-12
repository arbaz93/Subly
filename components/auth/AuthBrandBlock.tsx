import { Text, View } from "react-native";

type AuthBrandBlockProps = {
  title: string;
  subtitle: string;
};

export function AuthBrandBlock({ title, subtitle }: AuthBrandBlockProps) {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">S</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Subly</Text>
          <Text className="auth-wordmark-sub">Subscription clarity</Text>
        </View>
      </View>
      <Text className="auth-title">{title}</Text>
      <Text className="auth-subtitle">{subtitle}</Text>
    </View>
  );
}
