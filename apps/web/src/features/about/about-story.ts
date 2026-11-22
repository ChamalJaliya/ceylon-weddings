export type AboutStory = {
  title: string;
  excerpt: string | null;
  heading: string | null;
  lead: string | null;
  paragraphs: string[];
  pillars: { title: string; body: string }[];
};

/** Splits the CMS body: `## heading`, story paragraphs, then `### pillar` blocks. */
export function parseAboutBody(title: string, excerpt: string | null, body: string): AboutStory {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  let heading: string | null = null;
  const paragraphs: string[] = [];
  const pillars: { title: string; body: string }[] = [];
  for (const block of blocks) {
    if (block.startsWith("### ")) {
      const [first, ...rest] = block.slice(4).split("\n");
      pillars.push({ title: first!.trim(), body: rest.join(" ").trim() });
    } else if (block.startsWith("## ")) {
      heading ??= block.slice(3).trim();
    } else {
      paragraphs.push(block.replace(/\*\*/g, ""));
    }
  }
  const [lead = null, ...rest] = paragraphs;
  return { title, excerpt, heading, lead, paragraphs: rest, pillars };
}
