import { cva, type VariantProps } from "class-variance-authority";

export const nativeSelectVariants = cva("cursor-pointer pr-10 text-left");

export type NativeSelectVariants = VariantProps<typeof nativeSelectVariants>;
