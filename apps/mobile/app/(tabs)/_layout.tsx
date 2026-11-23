import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { ListChecks, Store, Users, Wallet, type LucideIcon } from "lucide-react-native";
import { BrandMark } from "@/components/brand";
import { Body, Button, Display, ScreenSkeleton } from "@/components/ui";
import { GlassTabBar } from "@/components/tabbar";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme";

/** Duotone: a soft tinted fill under the outline, solid-ish when active. */
function icon(Icon: LucideIcon) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon color={color} size={24} strokeWidth={focused ? 2 : 1.6} fill={focused ? `${color}38` : `${color}1f`} />
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { user, loading, signOut } = useAuth();
  if (loading) return <ScreenSkeleton />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "COUPLE" && user.role !== "FAMILY") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
          gap: 16,
          backgroundColor: t.page,
        }}
      >
        <BrandMark height={64} />
        <Display size={26} style={{ textAlign: "center" }}>
          This app is for couples
        </Display>
        <Body muted style={{ textAlign: "center" }}>
          Vendor and admin tools live on ceylonweddings.com.
        </Body>
        <View style={{ alignSelf: "stretch" }}>
          <Button label="Sign out" variant="outline" onPress={signOut} />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "shift" }}
    >
      <Tabs.Screen name="checklist" options={{ title: "Checklist", tabBarIcon: icon(ListChecks) }} />
      <Tabs.Screen name="vendors" options={{ title: "Vendors", tabBarIcon: icon(Store) }} />
      <Tabs.Screen name="index" options={{ title: "Wedding" }} />
      <Tabs.Screen name="guests" options={{ title: "Guests", tabBarIcon: icon(Users) }} />
      <Tabs.Screen name="budget" options={{ title: "Budget", tabBarIcon: icon(Wallet) }} />
    </Tabs>
  );
}
