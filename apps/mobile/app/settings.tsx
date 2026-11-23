import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import {
  Bell,
  Check,
  ChevronRight,
  Coins,
  ExternalLink,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  Languages,
  LogOut,
  MonitorSmartphone,
  Moon,
  Palette as PaletteIcon,
  Phone,
  Shield,
  User as UserIcon,
} from "lucide-react-native";
import { PALETTE_OPTIONS, type Palette, type ThemeMode } from "@ceylonweddings/contracts";
import { Sheet, type SheetRef } from "@/components/sheet";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Body,
  Button,
  Card,
  Display,
  Eyebrow,
  MorphButton,
  Screen,
  Segmented,
  SheetField,
  ThemedSwitch,
  success,
  tap,
} from "@/components/ui";
import { Rise } from "@/components/motion";
import { api, WEB_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  authenticateBiometric,
  biometricsAvailable,
  isBiometricsEnabled,
  setBiometricsEnabled,
} from "@/lib/biometrics";
import { font, paletteSwatch, useAppearance, useTheme } from "@/theme";

type Locale = "en" | "si" | "ta";
type Currency = "LKR" | "USD" | "AUD" | "GBP" | "EUR";
const CURRENCIES: Currency[] = ["LKR", "USD", "GBP", "AUD", "EUR"];

function Group({ title, children, index }: { title: string; children: ReactNode; index: number }) {
  return (
    <Rise index={index} style={{ marginTop: 26 }}>
      <Eyebrow size={10} style={{ marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Eyebrow>
      <Card padded={false} style={{ overflow: "hidden" }}>
        {children}
      </Card>
    </Rise>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  right,
  first,
  danger,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  first?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        minHeight: 56,
        paddingVertical: 10,
        backgroundColor: pressed ? t.inset : t.card,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: t.border,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: danger ? t.dangerSubtle : t.accentBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ flex: 1, fontFamily: font.sansMedium, fontSize: 15, color: danger ? t.danger : t.heading }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ fontFamily: font.sans, fontSize: 14, color: t.muted }} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right ?? (onPress ? <ChevronRight size={17} color={t.borderStrong} /> : null)}
    </Pressable>
  );
}

function PaletteSwatch({ value, selected, onPress }: { value: Palette; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const sw = paletteSwatch(value);
  const option = PALETTE_OPTIONS.find((o) => o.value === value)!;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        width: "47%",
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? t.primary : t.border,
        overflow: "hidden",
        backgroundColor: t.card,
      }}
    >
      <View style={{ height: 44, backgroundColor: sw.page, flexDirection: "row", padding: 8, gap: 6 }}>
        <View style={{ width: 10, borderRadius: 4, backgroundColor: sw.accent }} />
        <View
          style={{
            flex: 1,
            borderRadius: 6,
            backgroundColor: sw.card,
            borderWidth: 1,
            borderColor: t.border,
            padding: 6,
            gap: 4,
            justifyContent: "center",
          }}
        >
          <View style={{ height: 4, width: "70%", borderRadius: 2, backgroundColor: sw.accent, opacity: 0.85 }} />
          <View style={{ height: 3, width: "100%", borderRadius: 2, backgroundColor: t.border }} />
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 1.5,
            alignItems: "center",
            justifyContent: "center",
            borderColor: selected ? t.primary : t.border,
            backgroundColor: selected ? t.primary : "transparent",
          }}
        >
          {selected ? <Check size={11} color={t.primaryFg} strokeWidth={3} /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: font.sansMedium, fontSize: 12, color: t.heading }} numberOfLines={1}>
          {option.label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const t = useTheme();
  const toast = useToast();
  const { user, setUser, signOut } = useAuth();
  const { mode, setMode, palette, setPalette, syncAccount } = useAppearance();
  const profile = useRef<SheetRef>(null);
  const password = useRef<SheetRef>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [rsvpAlerts, setRsvpAlerts] = useState(true);
  const [bio, setBio] = useState<{ ok: boolean; label: string; on: boolean }>({
    ok: false,
    label: "Biometrics",
    on: false,
  });
  useEffect(() => {
    void (async () => {
      const avail = await biometricsAvailable();
      const on = avail.ok && (await isBiometricsEnabled());
      setBio({ ok: avail.ok, label: avail.label, on });
    })();
  }, []);
  if (!user) return null;
  const ic = (I: typeof UserIcon, c = t.primaryText) => <I size={17} color={c} />;

  async function toggleBio(next: boolean) {
    if (next) {
      const ok = await authenticateBiometric(`Enable ${bio.label}`);
      if (!ok) return;
      await setBiometricsEnabled(true);
      setBio((b) => ({ ...b, on: true }));
      success();
      toast(`${bio.label} unlocked`);
    } else {
      await setBiometricsEnabled(false);
      setBio((b) => ({ ...b, on: false }));
      toast(`${bio.label} off`, "info");
    }
  }

  async function patch(body: Parameters<typeof api.updateMe>[0], msg = "Saved") {
    try {
      const u = await api.updateMe(body);
      setUser(u);
      success();
      toast(msg);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
      return false;
    }
  }

  function changeMode(nextMode: ThemeMode) {
    setMode(nextMode);
    void syncAccount({ themeMode: nextMode });
  }

  function changePalette(next: Palette) {
    setPalette(next);
    void syncAccount({ palette: next });
  }

  async function saveProfile() {
    setBusy(true);
    if (await patch({ name: name.trim(), phone: phone.trim() || null }, "Profile updated")) profile.current?.dismiss();
    setBusy(false);
  }

  async function savePassword() {
    try {
      await api.changePassword(cur, next);
      toast("Password changed · other devices signed out");
      setCur("");
      setNext("");
      password.current?.dismiss();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't change password", "error");
      throw e;
    }
  }

  function signOutOthers() {
    Alert.alert("Sign out other devices?", "You'll stay signed in on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out others",
        style: "destructive",
        onPress: () =>
          api
            .revokeOtherSessions()
            .then(() => toast("Other devices signed out"))
            .catch(() => toast("Couldn't do that", "error")),
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen nav="back" eyebrow="Account" title="Settings" bottomSpace={60}>
        <Rise index={0}>
          <Pressable
            onPress={() => {
              tap();
              profile.current?.present();
            }}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Avatar name={user.name} size={58} />
              <View style={{ flex: 1 }}>
                <Display size={24}>{user.name}</Display>
                <Body muted size={13}>
                  {user.email}
                </Body>
                <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.primaryText, marginTop: 4 }}>
                  Edit profile
                </Text>
              </View>
              <ChevronRight size={18} color={t.borderStrong} />
            </Card>
          </Pressable>
        </Rise>

        <Group title="Preferences" index={1}>
          <View style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {ic(Moon)}
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>Appearance</Text>
            </View>
            <Segmented<ThemeMode>
              value={mode}
              onChange={changeMode}
              options={[
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </View>
          <View style={{ padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: t.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {ic(PaletteIcon)}
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>Palette</Text>
            </View>
            <Body muted size={13}>
              Same palettes as the web app — changes follow your account.
            </Body>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {PALETTE_OPTIONS.map((opt) => (
                <PaletteSwatch
                  key={opt.value}
                  value={opt.value}
                  selected={palette === opt.value}
                  onPress={() => changePalette(opt.value)}
                />
              ))}
            </View>
          </View>
          <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: t.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {ic(Languages)}
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>Language</Text>
            </View>
            <Segmented<Locale>
              value={user.locale as Locale}
              onChange={(l) => patch({ locale: l }, "Language updated")}
              options={[
                { value: "en", label: "English" },
                { value: "si", label: "සිංහල" },
                { value: "ta", label: "தமிழ்" },
              ]}
            />
          </View>
          <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: t.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {ic(Coins)}
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>Display currency</Text>
            </View>
            <Segmented<Currency>
              value={user.currency as Currency}
              onChange={(c) => patch({ currency: c }, `Showing prices in ${c}`)}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </View>
        </Group>

        <Group title="Notifications" index={2}>
          <Row
            first
            icon={ic(Bell)}
            label="Task & appointment reminders"
            right={<ThemedSwitch value={reminders} onValueChange={setReminders} />}
          />
          <Row
            icon={ic(Bell)}
            label="New RSVPs"
            right={<ThemedSwitch value={rsvpAlerts} onValueChange={setRsvpAlerts} />}
          />
        </Group>

        <Group title="Security" index={3}>
          <Row first icon={ic(KeyRound)} label="Change password" onPress={() => password.current?.present()} />
          {bio.ok ? (
            <Row
              icon={ic(Fingerprint)}
              label={`Unlock with ${bio.label}`}
              right={<ThemedSwitch value={bio.on} onValueChange={toggleBio} />}
            />
          ) : null}
          <Row icon={ic(MonitorSmartphone)} label="Sign out other devices" onPress={signOutOthers} />
          <Row
            icon={ic(Shield)}
            label="Two-factor authentication"
            value="On the web"
            onPress={() => Linking.openURL(`${WEB_URL}/planning/profile`)}
            right={<ExternalLink size={15} color={t.muted} />}
          />
        </Group>

        <Group title="About" index={4}>
          <Row
            first
            icon={ic(Globe)}
            label="Help & FAQ"
            onPress={() => Linking.openURL(`${WEB_URL}/faq`)}
            right={<ExternalLink size={15} color={t.muted} />}
          />
          <Row
            icon={ic(FileText)}
            label="Privacy policy"
            onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}
            right={<ExternalLink size={15} color={t.muted} />}
          />
          <Row
            icon={ic(FileText)}
            label="Terms of service"
            onPress={() => Linking.openURL(`${WEB_URL}/terms`)}
            right={<ExternalLink size={15} color={t.muted} />}
          />
          <Row icon={ic(Phone)} label="Version" value={Constants.expoConfig?.version ?? "0.1.0"} />
        </Group>

        <Rise index={5} style={{ marginTop: 26 }}>
          <Card padded={false} style={{ overflow: "hidden" }}>
            <Row
              first
              danger
              icon={ic(LogOut, t.danger)}
              label="Sign out"
              onPress={() =>
                Alert.alert("Sign out?", undefined, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign out", style: "destructive", onPress: signOut },
                ])
              }
              right={<View />}
            />
          </Card>
        </Rise>
      </Screen>

      <Sheet ref={profile} eyebrow="Account" title="Edit profile">
        <View style={{ gap: 14 }}>
          <SheetField label="Name" value={name} onChangeText={setName} />
          <SheetField
            label="Phone (WhatsApp)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+94 77 123 4567"
          />
          <View style={{ gap: 6 }}>
            <Eyebrow size={10}>Email</Eyebrow>
            <Body muted>{user.email}</Body>
          </View>
          <Button label="Save" onPress={saveProfile} loading={busy} disabled={name.trim().length < 2} />
        </View>
      </Sheet>

      <Sheet ref={password} eyebrow="Security" title="Change password">
        <View style={{ gap: 14 }}>
          <SheetField
            value={cur}
            onChangeText={setCur}
            secureTextEntry
            placeholder="Current password"
            textContentType="password"
          />
          <SheetField
            value={next}
            onChangeText={setNext}
            secureTextEntry
            placeholder="New password (8+ characters)"
            textContentType="newPassword"
          />
          <Body muted size={12}>
            Changing your password signs out every other device.
          </Body>
          <MorphButton
            label="Update password"
            onPress={savePassword}
            disabled={!cur || next.length < 8}
            successLabel="Updated"
          />
        </View>
      </Sheet>
    </View>
  );
}
