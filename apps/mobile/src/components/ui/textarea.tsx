import { TextInput, View, type TextInputProps } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTheme } from "@/theme";
import { HelperText, Label } from "./label";
import { inputSurface, inputStyles } from "./input-chrome";

type Props = TextInputProps & {
  label?: string;
  optional?: boolean;
  helper?: string;
  error?: string;
};

export function Textarea({ label, optional, helper, error, style, ...props }: Props) {
  const t = useTheme();
  return (
    <View style={inputStyles.wrap}>
      {label ? <Label optional={optional}>{label}</Label> : null}
      <TextInput
        multiline
        placeholderTextColor={t.muted}
        selectionColor={t.primary}
        textAlignVertical="top"
        {...props}
        style={[inputSurface(t, { multiline: true }), error ? { borderColor: t.danger } : null, style]}
      />
      {error ? <HelperText tone="danger">{error}</HelperText> : helper ? <HelperText>{helper}</HelperText> : null}
    </View>
  );
}

/** Multiline input safe inside @gorhom/bottom-sheet. */
export function SheetTextarea({ label, optional, helper, error, style, ...props }: Props) {
  const t = useTheme();
  return (
    <View style={inputStyles.wrap}>
      {label ? <Label optional={optional}>{label}</Label> : null}
      <BottomSheetTextInput
        multiline
        placeholderTextColor={t.muted}
        selectionColor={t.primary}
        textAlignVertical="top"
        {...props}
        style={[inputSurface(t, { multiline: true }), error ? { borderColor: t.danger } : null, style]}
      />
      {error ? <HelperText tone="danger">{error}</HelperText> : helper ? <HelperText>{helper}</HelperText> : null}
    </View>
  );
}
