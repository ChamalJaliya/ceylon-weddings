import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, RefreshControl, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { Check, HelpCircle, MessageCircle, Phone, Users, X } from "lucide-react-native";
import type { GuestHousehold } from "@ceylonweddings/contracts";
import { CountUp, Donut } from "@/components/motion";
import { Sheet, type SheetRef } from "@/components/sheet";
import { SwipeRow } from "@/components/swipe-row";
import { TAB_BAR_SPACE } from "@/components/tabbar";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Badge,
  Body,
  Button,
  Card,
  ContextMenu,
  Display,
  EmptyState,
  ErrorNote,
  Eyebrow,
  Pill,
  Screen,
  ScreenSkeleton,
  SearchField,
  Tabs,
  Touchable,
  success,
  tap,
} from "@/components/ui";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { font, radius, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

type Side = "ALL" | GuestHousehold["side"];
type Status = GuestHousehold["status"];
const heads = (list: GuestHousehold[]) => list.reduce((s, g) => s + 1 + g.plusCount, 0);
const TONE = {
  CONFIRMED: "success",
  DECLINED: "danger",
  MAYBE: "warning",
  INVITED: "info",
  CONSIDERING: "neutral",
  WALK_IN: "gold",
} as const;
const wa = (phone: string) => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`);

export default function Guests() {
  const t = useTheme();
  const toast = useToast();
  const sheet = useRef<SheetRef>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [side, setSide] = useState<Side>("ALL");
  const [open, setOpen] = useState<GuestHousehold | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, setData, error, loading, refreshing, refresh, reload } = useQuery(
    () => api.guests(debounced),
    [debounced],
  );
  const all = data ?? [];
  const shown = useMemo(() => (side === "ALL" ? all : all.filter((g) => g.side === side)), [all, side]);

  if (loading && !data) return <ScreenSkeleton />;

  const groups = [
    { label: "Confirmed", n: heads(all.filter((g) => g.status === "CONFIRMED")), color: t.success },
    {
      label: "Awaiting",
      n: heads(all.filter((g) => ["INVITED", "MAYBE", "CONSIDERING", "WALK_IN"].includes(g.status))),
      color: t.warning,
    },
    { label: "Declined", n: heads(all.filter((g) => g.status === "DECLINED")), color: t.danger },
  ];

  async function setStatus(g: GuestHousehold, status: Status) {
    const prev = all;
    success();
    setData(all.map((x) => (x.id === g.id ? { ...x, status } : x)));
    setOpen({ ...g, status });
    toast(`${g.headName} · ${titleCase(status)}`);
    await api.updateGuest(g.id, { status }).catch(() => {
      setData(prev);
      toast("Couldn't update", "error");
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen
        eyebrow={`${all.length} households`}
        title="Guests"
        bottomSpace={TAB_BAR_SPACE}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
      >
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <Donut size={128} stroke={13} segments={groups.map((g) => ({ value: g.n, color: g.color }))}>
            <CountUp
              value={heads(all)}
              style={{ fontFamily: font.display, fontSize: 34, color: t.heading, lineHeight: 36 }}
            />
            <Eyebrow size={8}>People</Eyebrow>
          </Donut>
          <View style={{ flex: 1, gap: 12 }}>
            {groups.map((g) => (
              <View key={g.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: g.color }} />
                <Body style={{ flex: 1 }} size={14}>
                  {g.label}
                </Body>
                <Text style={{ fontFamily: font.display, fontSize: 22, color: t.heading }}>{g.n}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ marginTop: 14 }}>
          <SearchField placeholder="Search by name or household" value={q} onChangeText={setQ} />
        </View>

        <View style={{ marginTop: 12 }}>
          <Tabs
            value={side}
            onChange={setSide}
            scrollable
            items={[
              { id: "ALL" as const, label: "Everyone", badge: all.length },
              { id: "BRIDE" as const, label: "Bride", badge: all.filter((g) => g.side === "BRIDE").length },
              { id: "GROOM" as const, label: "Groom", badge: all.filter((g) => g.side === "GROOM").length },
              { id: "BOTH" as const, label: "Both", badge: all.filter((g) => g.side === "BOTH").length },
            ]}
          />
        </View>

        <Card padded={false} style={{ marginTop: 16, overflow: "hidden" }}>
          {shown.map((g, i) => (
            <Animated.View
              key={g.id}
              layout={LinearTransition.duration(280)}
              entering={FadeIn.delay(Math.min(i, 12) * 25)}
              exiting={FadeOut}
            >
              <SwipeRow
                left={
                  g.phone
                    ? {
                        label: "WhatsApp",
                        icon: <MessageCircle size={22} color={t.overlay.onImageFg} />,
                        color: t.overlay.whatsapp,
                        onAction: () => wa(g.phone!),
                      }
                    : undefined
                }
                right={
                  g.phone
                    ? {
                        label: "Call",
                        icon: <Phone size={20} color={t.overlay.onImageFg} />,
                        color: t.info,
                        onAction: () => Linking.openURL(`tel:${g.phone}`),
                      }
                    : undefined
                }
              >
                <ContextMenu
                  title={g.headName}
                  eyebrow={g.label}
                  items={[
                    {
                      id: "confirmed",
                      label: "Mark confirmed",
                      icon: Check,
                      onPress: () => setStatus(g, "CONFIRMED"),
                    },
                    {
                      id: "maybe",
                      label: "Mark maybe",
                      icon: HelpCircle,
                      onPress: () => setStatus(g, "MAYBE"),
                    },
                    {
                      id: "declined",
                      label: "Mark declined",
                      icon: X,
                      destructive: true,
                      onPress: () => setStatus(g, "DECLINED"),
                    },
                    ...(g.phone
                      ? [
                          {
                            id: "wa",
                            label: "WhatsApp",
                            icon: MessageCircle,
                            onPress: () => wa(g.phone!),
                          },
                        ]
                      : []),
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      tap();
                      setOpen(g);
                      sheet.current?.present();
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      padding: 14,
                      backgroundColor: pressed ? t.inset : t.card,
                      borderTopWidth: i ? 1 : 0,
                      borderTopColor: t.border,
                    })}
                  >
                    <Avatar
                      name={g.headName}
                      tone={g.side === "BRIDE" ? "bride" : g.side === "GROOM" ? "groom" : "both"}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Body medium style={{ color: t.heading }} numberOfLines={1}>
                        {g.label}
                      </Body>
                      <Body muted size={13} numberOfLines={1}>
                        {g.headName}
                        {g.plusCount ? `  +${g.plusCount}` : ""}
                      </Body>
                    </View>
                    <Badge label={titleCase(g.status)} tone={TONE[g.status]} />
                  </Pressable>
                </ContextMenu>
              </SwipeRow>
            </Animated.View>
          ))}
          {!shown.length && !error ? (
            <EmptyState
              icon={<Users size={24} color={t.primaryText} />}
              title={q ? "No matches" : "No guests yet"}
              body={q ? "Try a different name." : "Import your list on ceylonweddings.com."}
            />
          ) : null}
        </Card>
        {shown.length ? (
          <Body muted size={12} style={{ textAlign: "center", marginTop: 10 }}>
            Tap for details · long-press RSVP · swipe to message or call
          </Body>
        ) : null}
      </Screen>

      <Sheet ref={sheet} eyebrow={open ? `${titleCase(open.side)}'s side` : undefined} title={open?.label ?? ""}>
        {open ? (
          <View style={{ gap: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Avatar
                name={open.headName}
                size={56}
                tone={open.side === "BRIDE" ? "bride" : open.side === "GROOM" ? "groom" : "both"}
              />
              <View style={{ flex: 1 }}>
                <Display size={22}>{open.headName}</Display>
                <Body muted size={13}>
                  {1 + open.plusCount} {open.plusCount ? "people" : "person"}
                  {open.meal ? ` · ${titleCase(open.meal)}` : ""}
                </Body>
              </View>
            </View>

            <View>
              <Eyebrow size={10} style={{ marginBottom: 10 }}>
                RSVP
              </Eyebrow>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(["CONFIRMED", "MAYBE", "INVITED", "DECLINED"] as Status[]).map((s) => (
                  <Pill key={s} label={titleCase(s)} active={open.status === s} onPress={() => setStatus(open, s)} />
                ))}
              </View>
            </View>

            {open.invites?.length ? (
              <View>
                <Eyebrow size={10} style={{ marginBottom: 10 }}>
                  Invited to
                </Eyebrow>
                <Card padded={false}>
                  {open.invites.map((inv, i) => (
                    <View
                      key={inv.eventId}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderTopWidth: i ? 1 : 0,
                        borderTopColor: t.border,
                      }}
                    >
                      <Body style={{ flex: 1, color: t.heading }}>{inv.eventName ?? "Event"}</Body>
                      <Badge label={titleCase(inv.status)} tone={TONE[inv.status]} />
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {open.notes ? (
              <Card>
                <Body size={14}>{open.notes}</Body>
              </Card>
            ) : null}

            {open.phone ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Touchable
                  onPress={() => wa(open.phone!)}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: radius.full,
                    backgroundColor: t.overlay.whatsapp,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle size={18} color={t.overlay.onImageFg} />
                  <Text style={{ fontFamily: font.sansMedium, color: t.overlay.onImageFg, fontSize: 15 }}>
                    WhatsApp
                  </Text>
                </Touchable>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Call"
                    variant="outline"
                    onPress={() => Linking.openURL(`tel:${open.phone}`)}
                    icon={<Phone size={17} color={t.heading} />}
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
