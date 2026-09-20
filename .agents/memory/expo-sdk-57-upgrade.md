---
name: Expo SDK 57 upgrade notes
description: Non-obvious compatibility notes for upgrading this mobile workspace to Expo SDK 57.
---

Expo SDK 57 rejects the legacy top-level `splash` app-config field; preserve splash customization through the `expo-splash-screen` config plugin instead. Its Expo-managed toolchain also moves the mobile app to TypeScript 6, where the existing `baseUrl` option requires an explicit deprecation acknowledgment until the path configuration is migrated.

**Why:** The SDK 57 upgrade checks fail on the old config shape, and TypeScript 6 treats the existing option as a hard diagnostic rather than a warning.

**How to apply:** When upgrading or regenerating this mobile app for SDK 57+, keep splash settings in the plugin configuration and retain the TypeScript compatibility acknowledgment unless the path aliases are rewritten.