import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { BrandMark } from "@/components/brand";
import { Body, Button, Display, Eyebrow, Field, IconButton } from "@/components/ui";
import { font, useTheme } from "@/theme";

/** Accepts a full invite link (…/w/nimali-and-kasun) or just the code. */
function slugFrom(input: string): string {
  const s = input.trim();
  const m = s.match(/\/w\/([^/?#]+)/);
  return (m ? m[1]! : s).toLowerCase().replace(/\s+/g, "-");
}

export default function GuestEntry() {
  const t = useTheme();
  const [value, setValue] = useState("");
  const open = () => value.trim() && router.replace(`/w/${slugFrom(value)}`);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.page }}>
      <View style={{ alignItems: "flex-end", padding: 16 }}>
        <IconButton label="Close" onPress={() => router.back()}>
          <X size={20} color={t.heading} />
        </IconButton>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}
      >
        <View style={{ alignItems: "center", marginBottom: 24, gap: 14 }}>
          <BrandMark height={64} />
          <Eyebrow>You're invited</Eyebrow>
          <Display size={34} style={{ textAlign: "center" }}>
            Open your{"\n"}
            <Display size={34} color={t.primaryText} style={{ fontFamily: font.displayItalic }}>
              invitation
            </Display>
          </Display>
          <Body muted style={{ textAlign: "center" }}>
            Paste the link from the couple's message, or type their wedding code.
          </Body>
        </View>
        <Field
          label="Invitation link or code"
          placeholder="ceylonweddings.com/w/…  or  nimali-and-kasun"
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={open}
          returnKeyType="go"
        />
        <Button label="Open invitation" disabled={!value.trim()} onPress={open} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
