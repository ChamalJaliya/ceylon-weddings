import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ToastProvider } from "@/components/toast";
import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import { Geist_400Regular, Geist_500Medium } from "@expo-google-fonts/geist";
import { AuthProvider, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { AppearanceProvider, font, useAppearance, useTheme } from "@/theme";
import { DrawerProvider } from "@/components/drawer";

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStatusBar() {
  const t = useTheme();
  return <StatusBar style={t.dark ? "light" : "dark"} />;
}

function AppearanceAccountSync() {
  const { user } = useAuth();
  const { hydrateFromUser } = useAppearance();
  useEffect(() => {
    hydrateFromUser(user);
  }, [user, hydrateFromUser]);
  return null;
}

function RootStack() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.page },
        headerTintColor: t.heading,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: t.page },
        headerTitleStyle: { fontFamily: font.display, fontSize: 20 },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen
        name="guest"
        options={{
          animation: "slide_from_bottom",
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetCornerRadius: 28,
        }}
      />
      <Stack.Screen name="w/[slug]" />
      <Stack.Screen name="calendar" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="agenda" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="vendor/[slug]"
        options={{ animation: "slide_from_right", gestureEnabled: true, fullScreenGestureEnabled: true }}
      />
    </Stack>
  );
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuth();
  return (
    <AppearanceProvider updatePreferences={api.updatePreferences} onUserUpdated={setUser}>
      <AppearanceAccountSync />
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ToastProvider>
            <DrawerProvider>
              <ThemedStatusBar />
              {children}
            </DrawerProvider>
          </ToastProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </AppearanceProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Geist_400Regular,
    Geist_500Medium,
  });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppChrome>
          <RootStack />
        </AppChrome>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
