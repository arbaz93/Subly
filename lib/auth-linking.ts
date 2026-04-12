import * as Linking from "expo-linking";

/** Deep link used by native OAuth / SSO with Clerk. Add this URL to your auth dashboard allowed redirect list. */
export function getOAuthRedirectUrl(): string {
  return Linking.createURL("sso-callback", { scheme: undefined });
}
