<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Subly Expo app. The following changes were made:

- **`app.config.js`** (new) — converts the static `app.json` into a dynamic config that reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from environment variables and exposes them via Expo Constants.
- **`.env`** — PostHog project token and host added (already gitignored).
- **`lib/posthog.ts`** (new) — PostHog client singleton configured with batching, feature flags, lifecycle capture, and debug mode in development.
- **`app/_layout.tsx`** — `PostHogProvider` wraps the app; a `NavigationRoot` component handles manual screen tracking via `usePathname` + `useEffect` (required for Expo Router).
- **`app/(auth)/sign-in.tsx`** — `user_signed_in` (email) and `user_signed_in_with_google` events captured on success; user identified via email on email sign-in.
- **`app/(auth)/sign-up.tsx`** — `user_signed_up`, `user_signed_up_with_google`, and `email_verification_completed` events captured; user identified via email on account creation.
- **`app/(auth)/reset-password.tsx`** — `password_reset_requested` and `password_reset_completed` events captured.
- **`lib/useSettings.ts`** — `user_signed_out` (with `posthog.reset()` to clear identity) and `profile_photo_updated` events captured.
- **`app/(tabs)/index.tsx`** — `subscription_card_expanded` (with `subscription_id` property) and `add_subscription_tapped` events captured.

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signed in with email and password | `app/(auth)/sign-in.tsx` |
| `user_signed_in_with_google` | User successfully signed in via Google SSO | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User successfully created a new account with email | `app/(auth)/sign-up.tsx` |
| `user_signed_up_with_google` | User successfully signed up via Google SSO | `app/(auth)/sign-up.tsx` |
| `email_verification_completed` | User verified their email during signup | `app/(auth)/sign-up.tsx` |
| `password_reset_requested` | User requested a password reset code | `app/(auth)/reset-password.tsx` |
| `password_reset_completed` | User successfully set a new password | `app/(auth)/reset-password.tsx` |
| `user_signed_out` | User signed out of the app | `lib/useSettings.ts` |
| `profile_photo_updated` | User updated their profile photo | `lib/useSettings.ts` |
| `subscription_card_expanded` | User expanded a subscription card on the home screen | `app/(tabs)/index.tsx` |
| `add_subscription_tapped` | User tapped the add subscription button | `app/(tabs)/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/362301/dashboard/1465313
- **Sign-up conversion funnel**: https://us.posthog.com/project/362301/insights/NEp2lTv7
- **Daily sign-ins (trend)**: https://us.posthog.com/project/362301/insights/BM076xeq
- **Sign-up method breakdown**: https://us.posthog.com/project/362301/insights/LRBnenmC
- **Password reset funnel**: https://us.posthog.com/project/362301/insights/XsTkqVcg
- **Subscription engagement**: https://us.posthog.com/project/362301/insights/0uyVPrrI

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
