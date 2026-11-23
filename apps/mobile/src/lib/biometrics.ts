import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENABLED_KEY = "cw-biometrics-enabled";
const EMAIL_KEY = "cw-last-email";

export async function biometricsAvailable(): Promise<{ ok: boolean; label: string }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const label = face ? "Face ID" : "Touch ID";
    return { ok: hasHardware && enrolled, label };
  } catch {
    return { ok: false, label: "Biometrics" };
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "1";
}

export async function setBiometricsEnabled(on: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, on ? "1" : "0");
}

export async function rememberEmail(email: string) {
  await AsyncStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

export async function lastEmail(): Promise<string | null> {
  return AsyncStorage.getItem(EMAIL_KEY);
}

/** Prompt Face ID / fingerprint. Returns true when the user authenticates. */
export async function authenticateBiometric(prompt = "Unlock Ceylon Weddings"): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: "Use password",
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
