import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { MoreHorizontal, type LucideIcon } from "lucide-react-native";
import { font, radius, useTheme } from "@/theme";
import { tap } from "./haptics";
import { IconButton } from "./button";
import { Display, Eyebrow } from "./typography";

export type ActionMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export type ActionMenuRef = {
  present: () => void;
  dismiss: () => void;
};

/** Action sheet / overflow menu — themed bottom sheet of actions. */
export const ActionMenu = forwardRef<
  ActionMenuRef,
  {
    title?: string;
    eyebrow?: string;
    items: readonly ActionMenuItem[];
    cancelLabel?: string;
  }
>(function ActionMenu({ title, eyebrow, items, cancelLabel = "Cancel" }, ref) {
  const t = useTheme();
  const sheet = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheet.current?.present(),
    dismiss: () => sheet.current?.dismiss(),
  }));

  const backdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheet}
      enableDynamicSizing
      backdropComponent={backdrop}
      backgroundStyle={{ backgroundColor: t.page, borderRadius: radius.hero }}
      handleIndicatorStyle={{ backgroundColor: t.borderStrong, width: 44 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
        {title ? (
          <View style={{ paddingHorizontal: 8, marginBottom: 12, marginTop: 4 }}>
            {eyebrow ? <Eyebrow style={{ marginBottom: 4 }}>{eyebrow}</Eyebrow> : null}
            <Display size={24}>{title}</Display>
          </View>
        ) : null}
        <View
          style={{
            borderRadius: radius.lg,
            overflow: "hidden",
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            const color = item.destructive ? t.danger : t.heading;
            return (
              <Pressable
                key={item.id}
                disabled={item.disabled}
                onPress={() => {
                  tap();
                  sheet.current?.dismiss();
                  setTimeout(item.onPress, 180);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  minHeight: 54,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? t.inset : t.card,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.border,
                  opacity: item.disabled ? 0.4 : 1,
                })}
              >
                {Icon ? (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: item.destructive ? t.dangerSubtle : t.accentBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} color={item.destructive ? t.danger : t.primaryText} />
                  </View>
                ) : null}
                <Text style={{ flex: 1, fontFamily: font.sansMedium, fontSize: 16, color }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => {
            tap();
            sheet.current?.dismiss();
          }}
          style={({ pressed }) => ({
            marginTop: 10,
            minHeight: 54,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: pressed ? t.inset : t.card,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontFamily: font.sansMedium, fontSize: 16, color: t.muted }}>{cancelLabel}</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

/** Overflow “···” button that opens an ActionMenu. */
export function MenuButton({
  items,
  title,
  eyebrow,
  label = "More actions",
}: {
  items: readonly ActionMenuItem[];
  title?: string;
  eyebrow?: string;
  label?: string;
}) {
  const t = useTheme();
  const menu = useRef<ActionMenuRef>(null);
  return (
    <>
      <IconButton label={label} onPress={() => menu.current?.present()}>
        <MoreHorizontal size={20} color={t.heading} />
      </IconButton>
      <ActionMenu ref={menu} title={title} eyebrow={eyebrow} items={items} />
    </>
  );
}
