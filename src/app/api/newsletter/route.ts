import { NextResponse } from "next/server";

type GitHubEntry = { name: string; path: string; download_url: string | null; type: string };

export const revalidate = 900;

const fallback = [{
  slug: "digest-10-01-2025",
  title: "ZecWeekly · 10 January 2025",
  date: "2025-01-10",
  excerpt: "A weekly field guide to the people, projects, and protocol work shaping a more private financial future.",
  content: "## Welcome to ZecWeekly\n\nYour weekly digest of Zcash ecosystem updates, community projects, and conversations worth following.\n\n## Zcash Updates\n\n### Protocol updates\n\nFollow the latest network, wallet, and research updates from across the Zcash ecosystem.\n\n### Community projects\n\nDiscover builders, educators, and local communities making private digital cash easier to use.",
  url: "https://github.com/ZecHub/zechub/tree/main/newsletter",
}];

function parseEntry(entry: GitHubEntry, content: string) {
  const dateMatch = `${entry.name}\n${content.slice(0, 1200)}`.match(/(\d{4})[-_](\d{2})[-_](\d{2})|(\d{2})[-_/](\d{2})[-_/](\d{4})/);
  if (!dateMatch) return null;
  const extractedDate = dateMatch[1]
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : `${dateMatch[6]}-${dateMatch[5]}-${dateMatch[4]}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(extractedDate) || Number.isNaN(new Date(`${extractedDate}T12:00:00`).getTime())) return null;
  const date = extractedDate;
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || entry.name.replace(/\.md$/i, "");
  const excerpt = content.replace(/^#+\s+/gm, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/[*_`>#-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  return { slug: entry.path.replace(/\.md$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase(), title, date, excerpt: excerpt || "A Zcash ecosystem digest from the ZecHub community.", content, url: `https://github.com/ZecHub/zechub/blob/main/${entry.path}` };
}

export async function GET() {
  try {
    const response = await fetch("https://api.github.com/repos/ZecHub/zechub/contents/newsletter?ref=main", { headers: { Accept: "application/vnd.github+json" }, next: { revalidate } });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const entries = (await response.json()) as GitHubEntry[];
    const markdownFiles = entries.filter((entry) => entry.type === "file" && entry.name.toLowerCase().endsWith(".md"));
    const newsletters = await Promise.all(markdownFiles.map(async (entry) => {
      if (!entry.download_url) return null;
      const contentResponse = await fetch(entry.download_url, { next: { revalidate } });
      return contentResponse.ok ? parseEntry(entry, await contentResponse.text()) : null;
    }));
    return NextResponse.json({ source: "github", newsletters: newsletters.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)).sort((a, b) => b.date.localeCompare(a.date) || b.title.localeCompare(a.title)) });
  } catch {
    return NextResponse.json({ source: "fallback", newsletters: fallback });
  }
}
