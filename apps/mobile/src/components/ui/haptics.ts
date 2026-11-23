import * as Haptics from "expo-haptics";

export const tap = () => Haptics.selectionAsync().catch(() => {});
export const impact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
