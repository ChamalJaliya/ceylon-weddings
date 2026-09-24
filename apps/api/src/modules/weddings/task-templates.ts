import type { WeddingType } from "@ceylonweddings/contracts";

export type TaskTemplate = { title: string; category: string };

const SHARED: TaskTemplate[] = [
  { title: "Book venue and hall", category: "venue" },
  { title: "Book photographer and videographer", category: "photo" },
  { title: "Book bridal dresser", category: "beauty" },
  { title: "Lock entertainment and music brief", category: "entertainment" },
];

const BY_TYPE: Record<WeddingType, TaskTemplate[]> = {
  KANDYAN_PORUWA: [
    { title: "Confirm nekath with astrologer", category: "tradition" },
    { title: "Book poruwa and ashtaka", category: "tradition" },
    { title: "Jayamangala gatha rehearsal", category: "tradition" },
  ],
  WESTERN_CHURCH: [
    { title: "Book church and priest", category: "tradition" },
    { title: "Publish banns / legal notices", category: "tradition" },
    { title: "Confirm ceremony music", category: "tradition" },
  ],
  HINDU: [
    { title: "Book priest and thaali", category: "tradition" },
    { title: "Plan mehndi evening", category: "tradition" },
    { title: "Confirm mandap and ceremony flow", category: "tradition" },
  ],
  MUSLIM_NIKAH: [
    { title: "Confirm maulvi and mahr note", category: "tradition" },
    { title: "Book walima hall", category: "venue" },
    { title: "Confirm halal catering", category: "venue" },
  ],
  HOMECOMING: [{ title: "Plan homecoming menu with family", category: "homecoming" }],
  ENGAGEMENT: [{ title: "Plan engagement ceremony", category: "tradition" }],
  MEHNDI: [
    { title: "Plan mehndi evening guest list", category: "guests" },
    { title: "Book mehndi artist", category: "beauty" },
  ],
  DESTINATION: [
    { title: "Arrange airport coaches for diaspora guests", category: "travel" },
    { title: "Confirm hotel block for overseas guests", category: "travel" },
  ],
};

export function templatesForTypes(types: WeddingType[]): TaskTemplate[] {
  const seen = new Set<string>();
  const templates: TaskTemplate[] = [];
  for (const item of [...SHARED, ...types.flatMap((type) => BY_TYPE[type] ?? [])]) {
    if (seen.has(item.title)) continue;
    seen.add(item.title);
    templates.push(item);
  }
  return templates;
}
