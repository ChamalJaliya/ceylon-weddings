import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeOutUp, SlideInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Info, XCircle } from "lucide-react-native";
import { font, radius, shadow, useTheme } from "@/theme";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };
const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((message: string, tone: Tone = "success") => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const Icon = toast?.tone === "error" ? XCircle : toast?.tone === "info" ? Info : CheckCircle2;
  const color = toast?.tone === "error" ? t.danger : toast?.tone === "info" ? t.info : t.success;
  return (
    <Ctx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={SlideInUp.duration(280)}
          exiting={FadeOutUp.duration(200)}
          pointerEvents="none"
          style={[
            { position: "absolute", top: insets.top + 8, left: 20, right: 20, zIndex: 1000, alignItems: "center" },
          ]}
        >
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: t.heading,
                borderRadius: radius.full,
                paddingVertical: 12,
                paddingHorizontal: 18,
              },
              shadow.raised,
            ]}
          >
            <Icon size={18} color={color} />
            <Text style={{ fontFamily: font.sansMedium, fontSize: 14, color: t.page }}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
