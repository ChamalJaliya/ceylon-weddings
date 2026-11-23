import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Check, ChevronDown } from "lucide-react-native";
import { font, radius, useTheme } from "@/theme";
import { tap } from "./haptics";
import { HelperText, Label } from "./label";
import { inputSurface } from "./input-chrome";
import { Display, Eyebrow } from "./typography";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Select<T extends string>({
  label,
  optional,
  placeholder = "Select…",
  options,
  value,
  onChange,
  helper,
  error,
  disabled,
  title,
}: {
  label?: string;
  optional?: boolean;
  placeholder?: string;
  options: readonly SelectOption<T>[];
  value?: T | null;
  onChange: (v: T) => void;
  helper?: string;
  error?: string;
  disabled?: boolean;
  /** Sheet title; defaults to label or "Choose". */
  title?: string;
}) {
  const t = useTheme();
  const sheet = useRef<BottomSheetModal>(null);
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const backdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
    ),
    [],
  );

  return (
    <View style={{ gap: 6 }}>
      {label ? <Label optional={optional}>{label}</Label> : null}
      <Pressable
        disabled={disabled}
        onPress={() => {
          tap();
          sheet.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel={label ?? title ?? "Select"}
        style={[
          inputSurface(t),
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            opacity: disabled ? 0.45 : 1,
            borderColor: error ? t.danger : t.border,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: font.sans,
            fontSize: 16,
            color: selected ? t.heading : t.muted,
          }}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={t.muted} />
      </Pressable>
      {error ? <HelperText tone="danger">{error}</HelperText> : helper ? <HelperText>{helper}</HelperText> : null}

      <BottomSheetModal
        ref={sheet}
        enableDynamicSizing
        backdropComponent={backdrop}
        backgroundStyle={{ backgroundColor: t.page, borderRadius: radius.hero }}
        handleIndicatorStyle={{ backgroundColor: t.borderStrong, width: 44 }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 }}>
          {label ? <Eyebrow style={{ marginBottom: 4 }}>{label}</Eyebrow> : null}
          <Display size={26}>{title ?? label ?? "Choose"}</Display>
        </View>
        <BottomSheetFlatList
          data={[...options]}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 36 }}
          renderItem={({ item }: { item: SelectOption<T> }) => {
            const active = item.value === value;
            return (
              <Pressable
                disabled={item.disabled}
                onPress={() => {
                  tap();
                  onChange(item.value);
                  sheet.current?.dismiss();
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: active ? t.accentBg : pressed ? t.inset : "transparent",
                  opacity: item.disabled ? 0.4 : 1,
                })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.sansMedium, fontSize: 16, color: t.heading }}>{item.label}</Text>
                  {item.description ? (
                    <Text style={{ fontFamily: font.sans, fontSize: 13, color: t.muted }}>{item.description}</Text>
                  ) : null}
                </View>
                {active ? <Check size={18} color={t.primary} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheetModal>
    </View>
  );
}

/** Compact select used in toolbars — same sheet picker, no outer label. */
export function SelectTrigger({
  label,
  children,
  onPress,
}: {
  label: string;
  children?: ReactNode;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityLabel={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.card,
      }}
    >
      {children ?? <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.heading }}>{label}</Text>}
      <ChevronDown size={14} color={t.muted} />
    </Pressable>
  );
}
