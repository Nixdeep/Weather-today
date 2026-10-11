---
name: Expo Go device validation
description: Constraints when validating native Expo Go behavior from this workspace.
---

Native Expo Go validation requires a user-connected phone or simulator. The Linux workspace may expose the Metro QR endpoint but does not necessarily provide `adb`, `xcrun`, or a connected device; a web preview is not a substitute for a native pass.

**Why:** A successful Expo SDK check and a rendered web preview cannot verify native navigation, keyboard, haptics, AsyncStorage, or device-specific safe-area behavior.

**How to apply:** Record the target and interaction steps only after a real Expo Go session. If no device is available, report the native pass as blocked and preserve the Metro/QR details for the user.