import { Easing } from "react-native-reanimated";

/**
 * One motion curve for the whole app: smooth ease-out, no overshoot, no bounce.
 * Use with withTiming(value, SMOOTH). Entrance builders use `.duration(MOTION_MS)`.
 */
export const MOTION_MS = 280;
export const SMOOTH = { duration: MOTION_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) };
