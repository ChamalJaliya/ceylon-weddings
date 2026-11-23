import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeOutUp, SlideInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Info, XCircle } from "lucide-react-native";
import { font, radius, shadow, useTheme } from "@/theme";
import { tap } from "./ui/haptics";

type Tone = "success" | "error" | "info";
type Toast = {
  id: number;
  message: string;
  tone: Tone;
  actionLabel?: string;
  onAction?: () => void;
};

type ShowToast = (
  message: string,
  toneOrOpts?: Tone | { tone?: Tone; actionLabel?: string; onAction?: () => void; durationMs?: number },
) => void;

const Ctx = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<ShowToast>((message, toneOrOpts) => {
    clearTimeout(timer.current);
    const opts =
      typeof toneOrOpts === "string" || toneOrOpts == null
        ? { tone: (toneOrOpts as Tone | undefined) ?? "success" }
        : toneOrOpts;
    const next: Toast = {
      id: Date.now(),
      message,
      tone: opts.tone ?? "success",
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
    };
    setToast(next);
    timer.current = setTimeout(() => setToast(null), opts.durationMs ?? (opts.actionLabel ? 4200 : 2600));
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
          style={[
            {
              position: "absolute",
              top: insets.top + 8,
              left: 20,
              right: 20,
              zIndex: 1000,
              alignItems: "center",
            },
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
                maxWidth: "100%",
              },
              shadow.raised,
            ]}
          >
            <Icon size={18} color={color} />
            <Text style={{ flexShrink: 1, fontFamily: font.sansMedium, fontSize: 14, color: t.page }}>
              {toast.message}
            </Text>
            {toast.actionLabel && toast.onAction ? (
              <Pressable
                onPress={() => {
                  tap();
                  toast.onAction?.();
                  clearTimeout(timer.current);
                  setToast(null);
                }}
                hitSlop={8}
                style={{ marginLeft: 4, paddingHorizontal: 8, paddingVertical: 4 }}
              >
                <Text style={{ fontFamily: font.sansMedium, fontSize: 14, color: t.primary }}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
