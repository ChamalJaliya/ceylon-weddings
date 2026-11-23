import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Mail } from "lucide-react-native";
import { BrandLockup } from "@/components/brand";
import { Body, Button, Display, Eyebrow, Field, success } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { font, useTheme } from "@/theme";

export default function Login() {
  const t = useTheme();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/" />;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      success();
    } catch (e) {
      setError(e instanceof Error && e.message !== "Unauthorized" ? e.message : "That email and password don't match.");
    } finally {
      setBusy(false);
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
                onSubmitEditing={submit}
                returnKeyType="go"
                error={error ?? undefined}
              />
              <Button label="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />

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
