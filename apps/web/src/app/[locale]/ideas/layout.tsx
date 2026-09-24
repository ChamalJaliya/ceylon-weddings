import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ideas · Ceylon Weddings",
  description: "Nekath, poruwa, homecoming, walima, and diaspora travel notes for Sri Lankan weddings.",
};

export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
