import { redirect } from "next/navigation";
import { DEFAULT_SETTINGS_HREF } from "@/features/settings/settings-config";

/** /settings → first section (Kloqra: Settings always lands on a real section). */
export default async function SettingsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}${DEFAULT_SETTINGS_HREF}`);
}
