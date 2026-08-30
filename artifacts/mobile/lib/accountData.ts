import AsyncStorage from "@react-native-async-storage/async-storage";

import { cancelAllPracticeNotifications } from "@/lib/practiceNotifications";

/**
 * Removes the local account-scoped data after a server account deletion.
 * Keeping this in one place prevents settings and the profile editor from
 * leaving different pieces of the old account on the device.
 */
export async function removeLocalAccountData() {
  const keys = await AsyncStorage.getAllKeys();
  const accountKeys = keys.filter(
    (key) =>
      key.startsWith("@resonance") ||
      key.startsWith("@resonancia") ||
      key.startsWith("@profile_") ||
      key === "cdc_user_profile" ||
      key.startsWith("cdc_avatar_synced"),
  );
  if (accountKeys.length > 0) {
    await AsyncStorage.multiRemove(accountKeys);
  }
  await cancelAllPracticeNotifications();
}