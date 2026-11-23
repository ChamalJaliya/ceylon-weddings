import { forwardRef, useCallback, type ReactNode } from "react";
import { View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Display, Eyebrow } from "./ui";
import { radius, useTheme } from "@/theme";

export type SheetRef = BottomSheetModal;

/** Themed bottom sheet with blurred-dim backdrop, grabber and a serif title. */
export const Sheet = forwardRef<
  BottomSheetModal,
  {
    title?: string;
    eyebrow?: string;
    children: ReactNode;
    snapPoints?: (string | number)[];
    footer?: ReactNode;
  }
>(function Sheet({ title, eyebrow, children, snapPoints, footer }, ref) {
  const t = useTheme();
  const backdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
    ),
    [],
  );
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      backdropComponent={backdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: t.page, borderRadius: radius.hero }}
      handleIndicatorStyle={{ backgroundColor: t.borderStrong, width: 44 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <View style={{ marginBottom: 18, marginTop: 4 }}>
            {eyebrow ? <Eyebrow style={{ marginBottom: 4 }}>{eyebrow}</Eyebrow> : null}
            <Display size={28}>{title}</Display>
          </View>
        ) : null}
        {children}
        {footer}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
