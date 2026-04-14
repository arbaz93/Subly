// app.config.js — extends the static app.json with dynamic environment variable extras.
// When this file exists alongside app.json, Expo uses it and ignores app.json at runtime.
const staticConfig = require('./app.json')

export default {
  ...staticConfig.expo,
  extra: {
    ...staticConfig.expo.extra,
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
}
