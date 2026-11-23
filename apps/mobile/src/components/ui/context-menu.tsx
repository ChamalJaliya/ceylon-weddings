import { useRef, type ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { impact } from "./haptics";
import { ActionMenu, type ActionMenuItem, type ActionMenuRef } from "./action-menu";

/**
 * Long-press to open an action sheet (iOS context-menu feel without a native popover).
 * Wrap any list row or card.
 */
export function ContextMenu({
  children,
  items,
  title,
  eyebrow,
}: {
  children: ReactNode;
  items: readonly ActionMenuItem[];
  title?: string;
  eyebrow?: string;
}) {
  const menu = useRef<ActionMenuRef>(null);
  const open = () => {
    impact();
    menu.current?.present();
  };
  const longPress = Gesture.LongPress()
    .minDuration(380)
    .onStart(() => {
      runOnJS(open)();
    });

  return (
    <>
      <GestureDetector gesture={longPress}>
        <View>{children}</View>
      </GestureDetector>
      <ActionMenu ref={menu} title={title} eyebrow={eyebrow} items={items} />
    </>
  );
}

export type { ActionMenuItem };
