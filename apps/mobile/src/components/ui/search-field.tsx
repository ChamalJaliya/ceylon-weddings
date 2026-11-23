import { Pressable, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { Search, X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { tap } from "./haptics";
import { inputSurface } from "./input-chrome";

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
  style,
  onClear,
  ...props
}: Omit<TextInputProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  onClear?: () => void;
}) {
  const t = useTheme();
  const clear = () => {
    tap();
    onChangeText?.("");
    onClear?.();
  };
  return (
    <View style={[{ position: "relative", justifyContent: "center" }, style]}>
      <View style={{ position: "absolute", left: 16, zIndex: 1 }} pointerEvents="none">
        <Search size={18} color={t.muted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        selectionColor={t.primary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        {...props}
        style={[inputSurface(t, { rounded: "full" }), { height: 48, paddingLeft: 44, paddingRight: value ? 42 : 16 }]}
      />
      {value ? (
        <Pressable
          onPress={clear}
          hitSlop={8}
          accessibilityLabel="Clear search"
          style={{
            position: "absolute",
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.inset,
          }}
        >
          <X size={14} color={t.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
