import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Fingerprint, Mail } from "lucide-react-native";
import { BrandLockup } from "@/components/brand";
import { Body, Button, Display, Eyebrow, Field, MorphButton, Shake } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  authenticateBiometric,
  biometricsAvailable,
  isBiometricsEnabled,
  lastEmail,
  rememberEmail,
} from "@/lib/biometrics";
import { font, useTheme } from "@/theme";

export default function Login() {
  const t = useTheme();
  const { user, signIn, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [bio, setBio] = useState<{ ok: boolean; label: string; enabled: boolean } | null>(null);

  useEffect(() => {
    void (async () => {
      const saved = await lastEmail();
      if (saved) setEmail(saved);
      const avail = await biometricsAvailable();
      const enabled = await isBiometricsEnabled();
      setBio({ ...avail, enabled: avail.ok && enabled });
    })();
  }, []);

  if (user) return <Redirect href="/" />;

  async function submit() {
    setError(null);
    try {
      await signIn(email.trim(), password);
      await rememberEmail(email.trim());
    } catch (e) {
      setShake((n) => n + 1);
      setError(e instanceof Error && e.message !== "Unauthorized" ? e.message : "That email and password don't match.");
      throw e;
    }
  }

  async function unlockWithBio() {
    const ok = await authenticateBiometric(`Unlock with ${bio?.label ?? "biometrics"}`);
    if (!ok) return;
    try {
      setUser(await api.me());
    } catch {
      setError(`Session expired — sign in with your password, then re-enable ${bio?.label ?? "biometrics"}.`);
      setShake((n) => n + 1);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <LinearGradient
        colors={[t.accentBg, t.page]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 420 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "space-between" }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", marginTop: 48 }}>
              <Animated.View entering={ZoomIn.duration(700).duration(280)}>
                <BrandLockup size="lg" layout="stack" />
              </Animated.View>
              <Animated.View entering={FadeIn.delay(400).duration(800)}>
                <Display size={30} style={{ textAlign: "center", marginTop: 36 }}>
                  Every ritual, every guest,{"\n"}
                  <Display size={30} style={{ fontFamily: font.displayItalic }} color={t.primaryText}>
                    beautifully planned.
                  </Display>
                </Display>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(600).duration(280)} style={{ gap: 14, marginTop: 40 }}>
              <Eyebrow style={{ textAlign: "center", marginBottom: 2 }}>Couples & family</Eyebrow>
              <Shake trigger={shake}>
                <View style={{ gap: 14 }}>
                  <Field
                    label="Email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      setError(null);
                    }}
                    returnKeyType="next"
                  />
                  <Field
                    label="Password"
                    placeholder="Your password"
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setError(null);
                    }}
                    onSubmitEditing={() => void submit().catch(() => {})}
                    returnKeyType="go"
                    error={error ?? undefined}
                  />
                </View>
              </Shake>
              <MorphButton label="Sign in" onPress={submit} disabled={!email || !password} successLabel="Welcome" />

              {bio?.enabled ? (
                <Button
                  label={`Unlock with ${bio.label}`}
                  variant="outline"
                  icon={<Fingerprint size={18} color={t.heading} />}
                  onPress={unlockWithBio}
                />
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                <Body muted size={13}>
                  or
                </Body>
                <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
              </View>

              <Button
                label="I have an invitation"
                variant="outline"
                icon={<Mail size={18} color={t.heading} />}
                onPress={() => router.push("/guest")}
              />
              <Body muted size={13} style={{ textAlign: "center", marginTop: 8 }}>
                New to Ceylon Weddings? Create your free account at ceylonweddings.com
              </Body>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
